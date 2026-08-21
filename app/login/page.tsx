"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    router.push("/votar");
  };

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/votar");
    };
    check();
  }, [router]);

  return (
    <main className="md:min-h-screen flex items-center justify-center py-4 px-4 md:px-8">
      <div className="w-full max-w-5xl bg-white [box-shadow:0_2px_10px_-3px_rgba(14,14,14,0.3)] rounded-2xl overflow-hidden">
        <div className="grid items-center w-full gap-4 md:grid-cols-2">
          <div className="md:aspect-8/10 bg-gray-50 relative before:absolute before:inset-0 before:bg-black/10 overflow-hidden w-full h-full">
            <Image
              src="/invitacion.jpeg"
              className="w-full h-full object-cover"
              alt="login image"
              width={1230}
              height={700}
            />
          </div>

          <div className="py-6 px-6 lg:px-8 max-md:-order-1">
            <div className="max-w-md mx-auto w-full">
              <p className="text-blue-900 text-md font-bold text-center uppercase m-2 pb-8">
                Panel de jurado
              </p>
              <h1 className="text-blue-800 text-3xl font-bold text-center">
                Votación Miss & Mister
              </h1>
              <p className="text-center mb-8 text-blue-900">
                Ingresá con las credenciales que te compartieron
              </p>

              <form className="space-y-6" onSubmit={handleLogin}>
                {error && (
                  <div className="bg-red-100 py-2 px-4 my-4 rounded-md text-sm flex items-center w-full">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 text-slate-900 font-medium text-sm inline-block"
                  >
                    CORREO ELECTRONICO
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jurado@gmail.com"
                    required
                    className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                  />
                </div>
                <div className="relative">
                  <label
                    htmlFor="password"
                    className="mb-2 text-slate-900 font-medium text-sm inline-block"
                  >
                    CONTRASEÑA
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="px-3 py-2.5 text-sm text-slate-900 rounded-md bg-white w-full outline-1 -outline-offset-1 outline-slate-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-3.5 text-sm rounded-md font-semibold cursor-pointer text-white border border-blue-600 bg-blue-800 hover:bg-blue-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  {loading ? "Ingresando..." : "Ingresar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
