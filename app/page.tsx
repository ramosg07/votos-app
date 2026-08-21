"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/votar");
      } else {
        router.replace("/login");
      }
    };
    check();
  }, [router]);

  return <div className="loading-state">Cargando…</div>;
}
