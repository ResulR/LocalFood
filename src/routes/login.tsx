import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, LogIn, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminI18n } from "@/lib/admin-i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — LocalFood" },
      {
        name: "description",
        content: "Connectez-vous à votre espace LocalFood.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { tAdmin } = useAdminI18n();
  const { user, role, loading, signIn } = useAuth();
  const [email, setEmail] = useState("resulramadani35@gmail.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: role === "superadmin" ? "/restaurant-dashboard" : "/restaurant-dashboard" });
    }
  }, [loading, navigate, role, user]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const result = await signIn(email.trim(), password);

    setSubmitting(false);

    if (result.error) {
      toast.error(tAdmin("admin.login.errorTitle"), { description: result.error });
      return;
    }

    toast.success(tAdmin("admin.login.success"));
    navigate({ to: "/restaurant-dashboard" });
  };

  return (
    <div className="min-h-screen bg-secondary/40 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-border bg-background shadow-elevated lg:grid-cols-[1fr_420px]">
          <div className="hidden bg-gradient-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
            <Link
              to="/"
              className="inline-flex w-fit items-center gap-2 rounded-full bg-background/10 px-4 py-2 text-sm font-medium backdrop-blur hover:bg-background/20"
            >
              <ArrowLeft className="h-4 w-4" />
              {tAdmin("admin.login.backToSite")}
            </Link>

            <div>
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-background/15 shadow-glow">
                <UtensilsCrossed className="h-7 w-7" />
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight">
                {tAdmin("admin.login.heroTitle")}
              </h1>
              <p className="mt-4 max-w-md text-sm text-primary-foreground/85">
                {tAdmin("admin.login.heroDescription")}
              </p>
            </div>

            <p className="text-xs text-primary-foreground/70">
              {tAdmin("admin.login.restrictedAccess")}
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <Link
              to="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              {tAdmin("admin.login.backToSite")}
            </Link>

            <div className="mb-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <UtensilsCrossed className="h-6 w-6" />
              </div>
              <h2 className="font-display text-3xl font-semibold">{tAdmin("admin.login.title")}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {tAdmin("admin.login.subtitle")}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="email" className="text-sm font-medium">
                  {tAdmin("admin.login.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="text-sm font-medium">
                  {tAdmin("admin.login.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-ring"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting || loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting || loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {tAdmin("admin.login.loading")}
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    {tAdmin("admin.login.submit")}
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {tAdmin("admin.login.noAccess")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
