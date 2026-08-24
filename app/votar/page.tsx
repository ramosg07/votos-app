"use client";

import { supabase } from "@/lib/supabase";
import { Menu, X, LogOut, User, Trophy, Star, Sparkles, ChevronRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Votar() {
  const router = useRouter();

  const [seleccionado, setSeleccionado] = useState("miss");
  const [user, setUser] = useState<null | any>(null);
  const [concursantes, setConcursantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");

  const categorias = [
    { value: "miss", label: "Miss" },
    { value: "mister", label: "Mister" },
    { value: "cholita", label: "Cholita" },
    { value: "nusta", label: "Ñusta" },
    { value: "chasqui", label: "Chasqui" },
  ];

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          router.replace("/login");
          return;
        }
        setUser(sessionData.session.user);

        // Fetch contestants and results in parallel
        const [{ data: rawConcursantes, error: errC }, { data: rawResultados, error: errR }] =
          await Promise.all([
            supabase
              .from("concursantes")
              .select("*")
              .eq("activo", true)
              .eq("categoria", seleccionado)
              .order("numero"),
            supabase
              .from("resultados")
              .select("*")
              .eq("categoria", seleccionado),
          ]);

        if (errC || errR) {
          throw new Error(errC?.message || errR?.message || "Error al obtener datos");
        }

        // Map contestants with their respective average scores
        const mappedConcursantes = (rawConcursantes || []).map((conc) => {
          const res = (rawResultados || []).find((r: any) => r.id === conc.id);
          return {
            ...conc,
            puntaje: res ? Number(res.promedio) : 0,
          };
        });

        setConcursantes(mappedConcursantes);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setError("Hubo un problema al cargar los datos. Por favor reintenta.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, seleccionado]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative pb-16 overflow-x-hidden">
      {/* Decorative ambient light */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg shadow-lg shadow-amber-500/10">
                <Trophy className="text-zinc-950" size={20} />
              </div>
              <div>
                <span className="text-sm font-extrabold tracking-[0.25em] text-white block uppercase">
                  Gala Imperial
                </span>
                <span className="text-[10px] text-amber-500 tracking-wider font-semibold block uppercase">
                  Miss & Mister
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-2">
              {categorias.map((categoria) => (
                <button
                  key={categoria.value}
                  onClick={() => setSeleccionado(categoria.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold tracking-wide transition-all cursor-pointer ${
                    seleccionado === categoria.value
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/5"
                      : "text-zinc-400 hover:text-white border border-transparent hover:bg-zinc-900/50"
                  }`}
                >
                  {categoria.label}
                </button>
              ))}
            </div>

            {/* User Session Info / Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                <User size={14} className="text-amber-500" />
                <span className="text-xs text-zinc-300 font-medium max-w-[150px] truncate">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer"
              >
                <LogOut size={14} />
                <span>Cerrar Sesión</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex lg:hidden items-center gap-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-zinc-400 hover:text-white bg-zinc-900/60 border border-zinc-800 rounded-lg"
                aria-label="Menú de categorías"
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="lg:hidden bg-zinc-950 border-b border-zinc-900 px-4 py-4 space-y-2 animate-fadeIn">
            <p className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase px-3 mb-2">
              Categorías
            </p>
            {categorias.map((categoria) => (
              <button
                key={categoria.value}
                onClick={() => {
                  setSeleccionado(categoria.value);
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold tracking-wide transition-all ${
                  seleccionado === categoria.value
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : "text-zinc-400 hover:text-white border border-transparent hover:bg-zinc-900/50"
                }`}
              >
                {categoria.label}
              </button>
            ))}
            <div className="h-px bg-zinc-900 my-4" />
            <div className="flex items-center justify-between px-3">
              <span className="text-xs text-zinc-400 truncate max-w-[200px]">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut size={12} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full flex-1">
        
        {/* Error message */}
        {error && (
          <div className="mb-8 max-w-2xl bg-red-500/10 border border-red-500/20 py-4 px-5 rounded-xl text-sm flex items-start gap-3.5 text-red-400">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <p className="font-semibold">Error de carga</p>
              <p className="text-xs text-red-400/80 mt-1">{error}</p>
              <button 
                onClick={() => setSeleccionado(seleccionado)}
                className="mt-3 text-xs bg-red-500/20 hover:bg-red-500/30 text-white font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="flex items-center gap-1.5 text-amber-500 text-xs font-bold tracking-[0.2em] uppercase mb-2">
              <Sparkles size={12} />
              <span>Calificaciones en Curso</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Emitir Puntajes
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
              Categoría Activa:
            </span>
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold px-3 py-1.5 rounded-lg tracking-wider uppercase">
              {categorias.find((c) => c.value === seleccionado)?.label}
            </span>
          </div>
        </div>

        {/* Loading State / Shimmer cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel border border-zinc-900 rounded-xl overflow-hidden shadow-lg h-[340px]">
                <div className="aspect-[4/3] w-full animate-shimmer" />
                <div className="p-5 space-y-4">
                  <div className="h-5 bg-zinc-900 rounded w-2/3 animate-shimmer" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-zinc-900 rounded w-1/3 animate-shimmer" />
                    <div className="h-9 bg-zinc-900 rounded w-1/3 animate-shimmer" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Empty State */}
            {concursantes.length === 0 ? (
              <div className="text-center py-16 px-4 glass-panel border border-zinc-900 rounded-2xl max-w-xl mx-auto mt-8">
                <div className="inline-flex p-4 bg-zinc-900/60 border border-zinc-800 rounded-full text-zinc-600 mb-4">
                  <Trophy size={36} />
                </div>
                <h3 className="text-lg font-bold text-white">No hay participantes</h3>
                <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
                  Todavía no se han cargado participantes activos para la categoría{" "}
                  <strong className="text-amber-500">
                    {categorias.find((c) => c.value === seleccionado)?.label}
                  </strong>
                  . Contactá al administrador del sistema.
                </p>
              </div>
            ) : (
              /* Participant Cards Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {concursantes.map((concursante) => {
                  const fotoSrc = concursante.foto_url || concursante.imagen_url || "/invitacion.jpeg";
                  const puntajeGuardado = concursante.puntaje || 0;

                  return (
                    <div
                      key={concursante.id}
                      className="glass-panel border border-zinc-900 rounded-xl overflow-hidden hover:border-amber-500/30 transition-all duration-300 shadow-lg hover:shadow-amber-500/5 group flex flex-col justify-between"
                    >
                      {/* Image container */}
                      <div className="aspect-[4/3] w-full relative bg-zinc-900 overflow-hidden">
                        <Image
                          src={fotoSrc}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.8] group-hover:brightness-[0.9]"
                          alt={concursante.nombre}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Elegant overlay gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                        
                        {/* Floating candidate number badge */}
                        <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 px-3 py-1 rounded-lg">
                          <span className="text-[10px] font-bold text-zinc-500 mr-1">N°</span>
                          <span className="text-sm font-extrabold text-amber-500">{concursante.numero}</span>
                        </div>
                      </div>

                      {/* Info & Action Section */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="text-white text-lg font-bold tracking-tight line-clamp-1 group-hover:text-amber-400 transition-colors">
                            {concursante.nombre}
                          </h3>
                        </div>

                        <div className="mt-5 flex justify-between items-center gap-3 pt-3 border-t border-zinc-900/60">
                          <div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                              Promedio
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {puntajeGuardado > 0 ? (
                                <>
                                  <Star className="text-amber-500 fill-amber-500 shrink-0" size={14} />
                                  <span className="text-lg text-white font-extrabold tracking-tight">
                                    {puntajeGuardado.toFixed(1)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xs text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                                  Sin Calificar
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              router.push(`/votar/${concursante.id}`);
                            }}
                            className={`flex items-center gap-1 py-2 px-4 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer ${
                              puntajeGuardado > 0
                                ? "bg-zinc-900 hover:bg-zinc-800 text-amber-500 border border-zinc-800 hover:border-amber-500/30"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 shadow-md shadow-amber-500/5 hover:shadow-amber-500/10"
                            }`}
                          >
                            <span>{puntajeGuardado > 0 ? "Modificar" : "Calificar"}</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
