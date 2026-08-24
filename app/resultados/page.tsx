"use client";

import { supabase } from "@/lib/supabase";
import {
  Menu,
  X,
  Trophy,
  Star,
  Sparkles,
  AlertCircle,
  Crown,
  Medal,
  Award,
  ListOrdered,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function ResultadosPage() {
  const router = useRouter();

  const [seleccionado, setSeleccionado] = useState("miss");
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
      const { data } = await supabase.auth.getSession();
      console.log("ENTROOOOO", { data });

      if (!data.session) {
        router.replace("/login");
        return;
      }
      console.log("ENTROOOOO");
      setLoading(true);
      setError("");
      try {
        // Fetch contestants and results in parallel (unauthenticated view results check)
        const [
          { data: rawConcursantes, error: errC },
          { data: rawResultados, error: errR },
        ] = await Promise.all([
          supabase
            .from("concursantes")
            .select("*")
            .eq("activo", true)
            .eq("categoria", seleccionado)
            .order("numero"),
          supabase.from("resultados").select("*").eq("categoria", seleccionado),
        ]);

        if (errC || errR) {
          throw new Error(
            errC?.message || errR?.message || "Error al obtener datos",
          );
        }

        // Map contestants with their respective average scores
        const mappedConcursantes = (rawConcursantes || []).map((conc) => {
          const res = (rawResultados || []).find((r: any) => r.id === conc.id);
          return {
            ...conc,
            puntaje: res ? Number(res.promedio) : 0.0,
          };
        });

        // Sort by average score descending (highest score first)
        const sortedConcursantes = mappedConcursantes.sort(
          (a, b) => b.puntaje - a.puntaje,
        );

        setConcursantes(sortedConcursantes);
      } catch (err: any) {
        console.error("Results load error:", err);
        setError(
          "Hubo un problema al cargar los resultados. Por favor reintenta.",
        );
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [seleccionado, router]);

  // Extract Podium positions
  const primerLugar = concursantes[0];
  const segundoLugar = concursantes[1];
  const tercerLugar = concursantes[2];

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative pb-16 overflow-x-hidden text-white">
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
                  Cómputo General
                </span>
                <span className="text-[10px] text-amber-500 tracking-wider font-semibold block uppercase">
                  Administrador
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

            {/* Back to voting panel */}
            <div className="hidden md:block">
              <button
                onClick={() => router.push("/votar")}
                className="flex items-center gap-1 text-zinc-400 hover:text-amber-500 font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Panel Votación</span>
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
            <button
              onClick={() => router.push("/votar")}
              className="w-full text-left px-4 py-2 text-xs font-bold text-zinc-400 hover:text-amber-500 flex items-center gap-1.5"
            >
              <ChevronLeft size={14} />
              <span>Volver al Panel Votación</span>
            </button>
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
              <span>Resultados Oficiales</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Ranking de Ganadores
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
              Categoría:
            </span>
            <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold px-3 py-1.5 rounded-lg tracking-wider uppercase">
              {categorias.find((c) => c.value === seleccionado)?.label}
            </span>
          </div>
        </div>

        {loading ? (
          /* Loading states */
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end pt-10">
              <div className="h-64 bg-zinc-900/60 rounded-xl animate-shimmer md:order-2" />
              <div className="h-56 bg-zinc-900/60 rounded-xl animate-shimmer md:order-1" />
              <div className="h-48 bg-zinc-900/60 rounded-xl animate-shimmer md:order-3" />
            </div>
            <div className="h-48 bg-zinc-900/60 rounded-xl animate-shimmer max-w-4xl mx-auto" />
          </div>
        ) : concursantes.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16 px-4 glass-panel border border-zinc-900 rounded-2xl max-w-xl mx-auto mt-8">
            <div className="inline-flex p-4 bg-zinc-900/60 border border-zinc-800 rounded-full text-zinc-600 mb-4">
              <Trophy size={36} />
            </div>
            <h3 className="text-lg font-bold text-white">Sin Concursantes</h3>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm mx-auto">
              No hay participantes activos registrados para la categoría{" "}
              <strong className="text-amber-500">
                {categorias.find((c) => c.value === seleccionado)?.label}
              </strong>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Visual Podium Section */}
            <div className="max-w-4xl mx-auto pt-6 pb-2">
              <h3 className="text-xs font-extrabold tracking-[0.2em] uppercase text-zinc-500 text-center mb-10">
                Podio de Honor
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                {/* 2ND PLACE CARD */}
                {segundoLugar && (
                  <div className="glass-panel border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-5 text-center flex flex-col items-center gap-3 relative order-2 md:order-1 shadow-lg group">
                    <div className="absolute top-4 left-4 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1 flex items-center gap-1">
                      <Medal className="text-slate-400" size={12} />
                      <span className="text-[10px] font-black text-slate-400">
                        2° Lugar
                      </span>
                    </div>

                    <div className="w-20 h-20 rounded-full overflow-hidden relative bg-zinc-900 border-2 border-slate-500 shadow-lg shadow-black/50 mt-4">
                      <Image
                        src={
                          segundoLugar.foto_url ||
                          segundoLugar.imagen_url ||
                          "/invitacion.jpeg"
                        }
                        alt={segundoLugar.nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="80px"
                      />
                    </div>

                    <div className="mt-2">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                        Candidato N° {segundoLugar.numero}
                      </p>
                      <h4 className="text-white font-bold text-md mt-0.5 line-clamp-1">
                        {segundoLugar.nombre}
                      </h4>
                    </div>

                    <div className="w-full bg-zinc-950/60 border border-zinc-900 py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 mt-2">
                      <Star
                        className="text-slate-400 fill-slate-400 shrink-0"
                        size={14}
                      />
                      <span className="text-lg font-black tracking-tight text-white">
                        {segundoLugar.puntaje.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold">
                        pts
                      </span>
                    </div>
                  </div>
                )}

                {/* 1ST PLACE CARD (WINNER - LARGER) */}
                {primerLugar && (
                  <div className="glass-panel border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-6 text-center flex flex-col items-center gap-3 relative order-1 md:order-2 shadow-xl shadow-amber-500/5 group min-h-[300px] bg-gradient-to-b from-amber-500/5 to-zinc-950/40">
                    <div className="absolute top-4 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1 flex items-center gap-1">
                      <Crown
                        className="text-amber-500 animate-bounce"
                        size={14}
                      />
                      <span className="text-xs font-black text-amber-400 tracking-wider">
                        GANADOR
                      </span>
                    </div>

                    <div className="w-28 h-28 rounded-full overflow-hidden relative bg-zinc-900 border-4 border-amber-500 shadow-2xl shadow-amber-500/10 mt-6 relative">
                      <Image
                        src={
                          primerLugar.foto_url ||
                          primerLugar.imagen_url ||
                          "/invitacion.jpeg"
                        }
                        alt={primerLugar.nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="110px"
                      />
                    </div>

                    <div className="mt-2">
                      <p className="text-amber-500 text-[10px] font-extrabold uppercase tracking-widest">
                        Candidato N° {primerLugar.numero}
                      </p>
                      <h4 className="text-white font-black text-xl mt-0.5 line-clamp-1">
                        {primerLugar.nombre}
                      </h4>
                    </div>

                    <div className="w-full bg-amber-500/10 border border-amber-500/20 py-3 px-5 rounded-xl flex items-center justify-center gap-1.5 mt-2">
                      <Star
                        className="text-amber-500 fill-amber-500 shrink-0"
                        size={16}
                      />
                      <span className="text-2xl font-black tracking-tight text-amber-400">
                        {primerLugar.puntaje.toFixed(2)}
                      </span>
                      <span className="text-xs text-amber-500 font-bold">
                        pts
                      </span>
                    </div>
                  </div>
                )}

                {/* 3RD PLACE CARD */}
                {tercerLugar && (
                  <div className="glass-panel border border-zinc-900/60 hover:border-zinc-800 rounded-2xl p-5 text-center flex flex-col items-center gap-3 relative order-3 shadow-lg group">
                    <div className="absolute top-4 left-4 bg-zinc-900 border border-zinc-800 rounded-full px-2 py-1 flex items-center gap-1">
                      <Award className="text-amber-700" size={12} />
                      <span className="text-[10px] font-black text-amber-700">
                        3° Lugar
                      </span>
                    </div>

                    <div className="w-20 h-20 rounded-full overflow-hidden relative bg-zinc-900 border-2 border-amber-700 shadow-lg shadow-black/50 mt-4">
                      <Image
                        src={
                          tercerLugar.foto_url ||
                          tercerLugar.imagen_url ||
                          "/invitacion.jpeg"
                        }
                        alt={tercerLugar.nombre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="80px"
                      />
                    </div>

                    <div className="mt-2">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                        Candidato N° {tercerLugar.numero}
                      </p>
                      <h4 className="text-white font-bold text-md mt-0.5 line-clamp-1">
                        {tercerLugar.nombre}
                      </h4>
                    </div>

                    <div className="w-full bg-zinc-950/60 border border-zinc-900 py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 mt-2">
                      <Star
                        className="text-amber-700 fill-amber-700 shrink-0"
                        size={14}
                      />
                      <span className="text-lg font-black tracking-tight text-white">
                        {tercerLugar.puntaje.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold">
                        pts
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Ranking List */}
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-6">
                <ListOrdered className="text-amber-500" size={20} />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Tabla General de Calificaciones
                </h3>
              </div>

              <div className="space-y-2">
                {concursantes.map((concursante, index) => {
                  const pos = index + 1;
                  const starColor =
                    pos === 1
                      ? "text-amber-500 fill-amber-500"
                      : pos === 2
                        ? "text-slate-400 fill-slate-400"
                        : pos === 3
                          ? "text-amber-700 fill-amber-700"
                          : "text-zinc-600 fill-zinc-600";

                  const positionBadge =
                    pos === 1 ? (
                      <span className="inline-flex items-center justify-center bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg w-8 h-8 shrink-0">
                        1°
                      </span>
                    ) : pos === 2 ? (
                      <span className="inline-flex items-center justify-center bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-black rounded-lg w-8 h-8 shrink-0">
                        2°
                      </span>
                    ) : pos === 3 ? (
                      <span className="inline-flex items-center justify-center bg-amber-900/20 border border-amber-900/40 text-amber-700 text-xs font-black rounded-lg w-8 h-8 shrink-0">
                        3°
                      </span>
                    ) : (
                      <span className="text-zinc-500 text-sm font-bold w-8 text-center shrink-0">
                        {pos}°
                      </span>
                    );

                  return (
                    <div
                      key={concursante.id}
                      className={`rounded-xl border transition-all ${
                        pos === 1
                          ? "bg-amber-500/[0.03] border-amber-500/20"
                          : "glass-panel border-zinc-900/60 hover:border-zinc-800"
                      }`}
                    >
                      {/* Mobile Layout: stacked vertically, no photo */}
                      <div className="flex md:hidden flex-col gap-2 p-4">
                        {/* Top row: position + name */}
                        <div className="flex items-center gap-2 min-w-0">
                          {positionBadge}
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-white block truncate">
                              {concursante.nombre}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-bold">
                              N° {concursante.numero}
                            </span>
                          </div>
                        </div>
                        {/* Bottom row: score pill */}
                        <div className="flex items-center gap-1.5 bg-zinc-900/70 border border-zinc-800 px-3 py-2 rounded-lg self-start font-mono">
                          <Star size={13} className={starColor} />
                          <span className="text-base font-black text-white">
                            {concursante.puntaje.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-bold">
                            pts
                          </span>
                        </div>
                      </div>

                      {/* Desktop Layout: horizontal with photo */}
                      <div className="hidden md:flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {positionBadge}
                          {/* Photo */}
                          <div className="w-10 h-10 rounded-full overflow-hidden relative bg-zinc-900 shrink-0 border border-zinc-800">
                            <Image
                              src={
                                concursante.foto_url ||
                                concursante.imagen_url ||
                                "/invitacion.jpeg"
                              }
                              alt={concursante.nombre}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          {/* Name & Number */}
                          <div className="min-w-0">
                            <span className="text-sm font-bold text-white block truncate">
                              {concursante.nombre}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-bold block mt-0.5">
                              Candidato N° {concursante.numero}
                            </span>
                          </div>
                        </div>
                        {/* Score */}
                        <div className="shrink-0 flex items-center gap-1 bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 rounded-lg font-mono">
                          <Star size={12} className={starColor} />
                          <span className="text-sm font-extrabold text-white">
                            {concursante.puntaje.toFixed(2)}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-bold">
                            pts
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
