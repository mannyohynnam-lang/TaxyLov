import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Transaction, YearEnd } from "./taxy-types";
import { DEFAULT_YEAREND } from "./taxy-types";

const TX_KEY = "taxy.transactions.v1";
const YE_KEY = "taxy.yearend.v1";
const MIGRATED_FLAG = "taxy.migrated.v1";

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function useUserId() {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUid(data.session?.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUid(session?.user?.id ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);
  return uid;
}

export function useTransactions() {
  const uid = useUserId();
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const migratedRef = useRef(false);

  const refresh = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, date, description, category, amount, period")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error && data) {
      setItems(data.map((r) => ({
        id: r.id,
        date: r.date,
        description: r.description ?? "",
        category: r.category as Transaction["category"],
        amount: Number(r.amount),
        period: (r.period as Transaction["period"]) ?? "daily",
      })));
    }
    setLoading(false);
    // One-time migration of any local data
    const migratedKey = `${MIGRATED_FLAG}.${userId}`;
    if (!migratedRef.current && !localStorage.getItem(migratedKey)) {
      migratedRef.current = true;
      const local = readLocal<Transaction[]>(TX_KEY, []);
      if (local.length && (data?.length ?? 0) === 0) {
        await supabase.from("transactions").insert(
          local.map((t) => ({
            user_id: userId,
            date: t.date,
            description: t.description,
            category: t.category,
            amount: t.amount,
            period: t.period ?? "daily",
          })),
        );
        const localYe = readLocal<YearEnd | null>(YE_KEY, null);
        if (localYe) {
          await supabase.from("year_end_inputs").upsert({ user_id: userId, data: JSON.parse(JSON.stringify(localYe)) });
        }
        const { data: re } = await supabase
          .from("transactions")
          .select("id, date, description, category, amount, period")
          .order("date", { ascending: false });
        if (re) setItems(re.map((r) => ({
          id: r.id, date: r.date, description: r.description ?? "",
          category: r.category as Transaction["category"], amount: Number(r.amount),
          period: (r.period as Transaction["period"]) ?? "daily",
        })));
      }
      localStorage.setItem(migratedKey, "1");
    }
  }, []);

  useEffect(() => {
    if (!uid) { setItems([]); setLoading(false); return; }
    setLoading(true);
    refresh(uid);
  }, [uid, refresh]);

  const add = useCallback(async (t: Omit<Transaction, "id">) => {
    if (!uid) return;
    const { data } = await supabase.from("transactions").insert({
      user_id: uid, date: t.date, description: t.description,
      category: t.category, amount: t.amount, period: t.period ?? "daily",
    }).select().single();
    if (data) {
      setItems((prev) => [{
        id: data.id, date: data.date, description: data.description ?? "",
        category: data.category as Transaction["category"], amount: Number(data.amount),
        period: (data.period as Transaction["period"]) ?? "daily",
      }, ...prev]);
    }
  }, [uid]);

  const update = useCallback(async (id: string, patch: Partial<Omit<Transaction, "id">>) => {
    if (!uid) return;
    const { data } = await supabase.from("transactions")
      .update({ ...patch })
      .eq("id", id).select().single();
    if (data) {
      setItems((prev) => prev.map((t) => t.id === id ? {
        id: data.id, date: data.date, description: data.description ?? "",
        category: data.category as Transaction["category"], amount: Number(data.amount),
        period: (data.period as Transaction["period"]) ?? "daily",
      } : t));
    }
  }, [uid]);

  const remove = useCallback(async (id: string) => {
    if (!uid) return;
    await supabase.from("transactions").delete().eq("id", id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, [uid]);

  const clear = useCallback(async () => {
    if (!uid) return;
    await supabase.from("transactions").delete().eq("user_id", uid);
    setItems([]);
  }, [uid]);

  return { items, add, update, remove, clear, loading };
}

export function useYearEnd() {
  const uid = useUserId();
  const [data, setData] = useState<YearEnd>(DEFAULT_YEAREND);

  useEffect(() => {
    if (!uid) { setData(DEFAULT_YEAREND); return; }
    supabase.from("year_end_inputs").select("data").eq("user_id", uid).maybeSingle().then(({ data: row }) => {
      if (row?.data) setData({ ...DEFAULT_YEAREND, ...(row.data as Partial<YearEnd>) });
    });
  }, [uid]);

  const save = useCallback(async (next: YearEnd) => {
    setData(next);
    if (!uid) return;
    await supabase.from("year_end_inputs").upsert({ user_id: uid, data: JSON.parse(JSON.stringify(next)) });
  }, [uid]);

  return { data, save };
}
