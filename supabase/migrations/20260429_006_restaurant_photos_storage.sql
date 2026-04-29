-- LocalFood — Restaurant photos storage
-- Purpose:
-- Create a public Supabase Storage bucket for restaurant photos and allow company members
-- to upload files only inside the folder of restaurants they can manage.
--
-- Path convention:
-- restaurant-photos/<restaurant_id>/<filename>

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'restaurant-photos',
  'restaurant-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Company members can upload restaurant photos" on storage.objects;

create policy "Company members can upload restaurant photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'restaurant-photos'
  and exists (
    select 1
    from public.restaurants r
    where r.id::text = (storage.foldername(storage.objects.name))[1]
      and (
        public.has_role(auth.uid(), 'superadmin'::public.app_role)
        or (
          r.company_id is not null
          and public.is_company_member(auth.uid(), r.company_id)
          and (
            public.has_role(auth.uid(), 'admin'::public.app_role)
            or public.has_role(auth.uid(), 'user'::public.app_role)
          )
        )
      )
  )
);