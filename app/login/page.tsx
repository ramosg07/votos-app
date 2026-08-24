"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Mail, AlertTriangle, Loader2 } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError("Correo o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      router.push("/votar");
    } catch {
      setError("Ocurrió un error inesperado. Intente de nuevo.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace("/votar");
    };
    check();
  }, [router]);

  return (
    <main className="min-h-screen w-full flex items-center justify-center px-4 py-8 relative overflow-hidden bg-zinc-950">
      {/* Decorative ambient light */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-5xl glass-panel rounded-2xl shadow-2xl shadow-black/80 overflow-hidden relative z-10">
        <div className="grid md:grid-cols-2 items-stretch min-h-[500px]">
          {/* Image/Cover Column */}
          <div className="relative w-full min-h-[250px] md:min-h-full bg-zinc-900">
            <Image
              src="/invitacion.jpeg"
              className="absolute inset-0 w-full h-full object-cover opacity-85 brightness-[0.75] contrast-[1.05]"
              alt="Gala Event Invitation"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent md:bg-gradient-to-r md:from-transparent md:to-zinc-950/90" />
            
            {/* Overlay badge/text inside the image */}
            <div className="absolute bottom-6 left-6 right-6 md:bottom-12 md:left-12 z-20">
              <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-bold tracking-[0.2em] uppercase px-2.5 py-1 rounded-full backdrop-blur-md">
                Edición Especial
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3 drop-shadow-md">
                Gala de Elección
              </h2>
              <p className="text-zinc-300 text-xs md:text-sm mt-1.5 font-light max-w-md drop-shadow-sm">
                Un encuentro de elegancia, talento y tradición. Tu voto decide la corona.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="p-8 md:p-12 flex flex-col justify-center bg-zinc-950/40">
            <div className="max-w-md mx-auto w-full">
              <div className="mb-8">
                <span className="text-[10px] font-bold tracking-[0.25em] text-amber-500 uppercase block mb-1">
                  Panel de Jurados
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Ingreso al Sistema
                </h1>
                <p className="text-sm text-zinc-400 mt-2">
                  Por favor, ingresá las credenciales asignadas para iniciar la votación.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleLogin}>
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-lg text-sm flex items-center gap-3 text-red-400 animate-fadeIn">
                    <AlertTriangle size={18} className="shrink-0" />
                    <p className="font-medium">{error}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-xs font-bold uppercase tracking-wider text-zinc-300"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jurado@evento.com"
                      required
                      className="pl-10 pr-4 py-3 text-sm text-white rounded-lg bg-zinc-900/60 border border-zinc-800 w-full focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-xs font-bold uppercase tracking-wider text-zinc-300"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-500">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10 pr-4 py-3 text-sm text-white rounded-lg bg-zinc-900/60 border border-zinc-800 w-full focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3.5 px-4 text-sm rounded-lg font-bold text-zinc-950 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Ingresando...</span>
                    </>
                  ) : (
                    <span>Iniciar Sesión</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
