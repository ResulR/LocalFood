// Store favoris ultra-simple basé sur localStorage + listeners.
// 100% côté front, aucun backend.
import { useEffect, useState, useCallback } from "react";

const KEY = "localfood:favorites";
const listeners = new Set<() => void>();

const read = (): string[] => {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
};

const write = (ids: string[]) => {
  if (typeof window === "undefined") return;

  localStorage.setItem(KEY, JSON.stringify(ids));
  listeners.forEach((l) => l());
};

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const update = () => setIds(read());

    update();
    listeners.add(update);

    return () => {
      listeners.delete(update);
    };
  }, []);

  const toggle = useCallback((id: string) => {
    const cur = read();
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];

    write(next);

    return next.includes(id);
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
