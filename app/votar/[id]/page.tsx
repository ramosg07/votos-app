"use client";

import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, Save, Check, AlertTriangle, Minus, Plus, Star, Award, Loader2 } from "lucide-react";

export default function VotarPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [criterios, setCriterios] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [user, setUser] = useState<null | any>(null);
  const [concursante, setConcursante] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const init = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          router.replace("/login");
          return;
        }
        setUser(sessionData.session.user);

        // 1️⃣ Primero cargar el concursante para conocer su categoría
        const { data: dataConcursante, error: errC } = await supabase
          .from("concursantes")
          .select("*")
          .eq("activo", true)
          .eq("id", id)
          .maybeSingle();

        if (errC) throw new Error(errC.message);

        if (!dataConcursante) {
          setErrorMessage("El concursante no existe o no está activo.");
          setLoading(false);
          return;
        }

        setConcursante(dataConcursante);

        // 2️⃣ Con la categoría del concursante, traer sus criterios + los votos existentes en paralelo
        const [
          { data: dataCriterios, error: errCr },
          { data: dataVotos, error: errV },
        ] = await Promise.all([
          supabase
            .from("criterios")
            .select("*")
            // criterios propios de la categoría O criterios globales (categoria IS NULL)
            .or(`categoria.eq.${dataConcursante.categoria},categoria.is.null`)
            .order("orden"),
          supabase
            .from("votos")
            .select("*")
            .eq("juez_id", sessionData.session.user.id)
            .eq("concursante_id", id),
        ]);

        if (errCr || errV) {
          throw new Error(errCr?.message || errV?.message || "Error al cargar criterios/votos");
        }

        setCriterios(dataCriterios || []);

        // Cargar puntajes previos, por defecto 5.0
        const initialScores: Record<string, number> = {};
        (dataCriterios || []).forEach((crit: any) => {
          const matchingVote = (dataVotos || []).find((v: any) => v.criterio_id === crit.id);
          initialScores[`${id}_${crit.id}`] = matchingVote ? Number(matchingVote.puntaje) : 5.0;
        });

        setScores(initialScores);
      } catch (err: any) {
        console.error("Initialization error:", err);
        setErrorMessage("Error al conectar con la base de datos. Reintenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [id, router]);

  const handleScoreChange = (criterioId: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [`${id}_${criterioId}`]: Number(value),
    }));
  };

  const adjustScore = (criterioId: string, delta: number) => {
    const key = `${id}_${criterioId}`;
    const current = scores[key] ?? 5.0;
    const nextVal = Math.max(0, Math.min(10, current + delta));
    setScores((prev) => ({
      ...prev,
      [key]: Number(nextVal.toFixed(1)),
    }));
  };

  const handleSave = useCallback(async () => {
    if (!user || !concursante) return;
    setStatus("saving");

    try {
      const rows = criterios.map((crit) => ({
        juez_id: user.id,
        concursante_id: id,
        criterio_id: crit.id,
        puntaje: scores[`${id}_${crit.id}`] ?? 5.0,
      }));

      const { error } = await supabase
        .from("votos")
        .upsert(rows, { onConflict: "juez_id,concursante_id,criterio_id" });

      if (error) {
        console.error("Supabase upsert error:", error);
        setStatus("error");
        return;
      }

      setStatus("ok");
      setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch (err) {
      console.error("Save error:", err);
      setStatus("error");
    }
  }, [criterios, scores, user, id, concursante]);

  // Compute live sum and average
  const getSumScore = () => {
    return criterios.reduce((sum, crit) => sum + (scores[`${id}_${crit.id}`] ?? 5.0), 0);
  };

  const getAverageScore = () => {
    if (criterios.length === 0) return 0;
    return getSumScore() / criterios.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white px-4">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
        <p className="text-zinc-400 text-sm font-medium tracking-wide">Cargando perfil del participante…</p>
      </div>
    );
  }

  if (errorMessage || !concursante) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white px-4">
        <div className="glass-panel border border-zinc-900 p-8 rounded-2xl max-w-md w-full text-center">
          <AlertTriangle className="text-red-500 mx-auto mb-4" size={44} />
          <h2 className="text-lg font-bold text-white mb-2">Error de Carga</h2>
          <p className="text-sm text-zinc-400 mb-6">{errorMessage || "Participante no encontrado."}</p>
          <button
            onClick={() => router.push("/votar")}
            className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Volver al panel</span>
          </button>
        </div>
      </div>
    );
  }

  const fotoSrc = concursante.foto_url || concursante.imagen_url || "/invitacion.jpeg";

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col relative pb-12 overflow-x-hidden">
      {/* Decorative ambient light */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header bar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-zinc-900 bg-zinc-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/votar")}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-amber-500 transition-all font-bold text-xs tracking-wider uppercase cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>Volver</span>
          </button>
          
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest">
              {concursante.categoria}
            </span>
            <span className="text-zinc-500 font-medium">|</span>
            <span className="text-xs text-zinc-400 font-medium">Candidato N° {concursante.numero}</span>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Candidate Info and Image */}
        <section className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6">
          <div className="glass-panel border border-zinc-900 rounded-2xl overflow-hidden p-4 shadow-xl">
            {/* Candidate Image Card */}
            <div className="aspect-[3/4] w-full relative bg-zinc-900 rounded-xl overflow-hidden shadow-inner">
              <Image
                src={fotoSrc}
                className="w-full h-full object-cover brightness-[0.8] contrast-[1.05]"
                alt={concursante.nombre}
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 30vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
              
              {/* Number overlay */}
              <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md border border-zinc-800 w-12 h-12 rounded-xl flex flex-col items-center justify-center shadow-lg">
                <span className="text-[8px] font-extrabold text-zinc-500 uppercase tracking-tighter">N°</span>
                <span className="text-lg font-black text-amber-500 leading-none">{concursante.numero}</span>
              </div>
            </div>

            {/* Candidate Details */}
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-black tracking-tight text-white">{concursante.nombre}</h2>
              <p className="text-xs text-zinc-400 mt-1 uppercase tracking-[0.15em] font-semibold">
                Categoría: <span className="text-amber-500">{concursante.categoria}</span>
              </p>
            </div>
          </div>

          {/* Real-time calculated score summary panel */}
          <div className="glass-panel border border-zinc-900 rounded-2xl p-6 shadow-xl flex flex-col justify-center items-center gap-2">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
              <Star className="text-amber-500 fill-amber-500" size={12} />
              <span>Calificación en tiempo real</span>
            </div>
            
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-5xl font-black text-white tracking-tighter">
                {getAverageScore().toFixed(1)}
              </span>
              <span className="text-zinc-500 font-bold text-lg">/10</span>
            </div>

            <div className="text-xs text-zinc-400 font-medium bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 mt-2">
              Suma Total: <strong className="text-white">{getSumScore().toFixed(1)} pts</strong>
            </div>
          </div>
        </section>

        {/* Right Column: Scoring Form */}
        <section className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
          <div className="glass-panel border border-zinc-900 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-5 mb-6">
              <Award className="text-amber-500" size={22} />
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Criterios de Evaluación</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Deslizá los controles o utilizá los botones de precisión para asignar puntajes.
                </p>
              </div>
            </div>

            {/* Criteria control list */}
            <div className="space-y-6">
              {criterios.map((crit) => {
                const key = `${id}_${crit.id}`;
                const value = scores[key] ?? 5.0;

                return (
                  <div 
                    key={crit.id} 
                    className="p-4 bg-zinc-950/40 border border-zinc-900/60 rounded-xl hover:border-zinc-800 transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-sm tracking-wide text-zinc-200">
                        {crit.nombre}
                      </span>
                      <span className="bg-zinc-900 border border-zinc-800 text-amber-500 text-sm font-extrabold px-3 py-1 rounded-md min-w-[45px] text-center font-mono">
                        {value.toFixed(1)}
                      </span>
                    </div>

                    {/* Slider & Precision Buttons Controls */}
                    <div className="flex items-center gap-3">
                      {/* Minus Button */}
                      <button
                        type="button"
                        onClick={() => adjustScore(crit.id, -0.5)}
                        className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
                        title="Restar 0.5"
                      >
                        <Minus size={14} />
                      </button>

                      {/* Customized Range Input */}
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={value}
                        onChange={(e) => handleScoreChange(crit.id, Number(e.target.value))}
                        className="slider-custom flex-1 cursor-ew-resize"
                      />

                      {/* Plus Button */}
                      <button
                        type="button"
                        onClick={() => adjustScore(crit.id, 0.5)}
                        className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
                        title="Sumar 0.5"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Save Buttons Panel */}
            <div className="mt-10 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={status === "saving"}
                className={`w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold tracking-wider uppercase transition-all duration-300 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                  status === "saving"
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed"
                    : status === "ok"
                    ? "bg-green-500 text-zinc-950 font-black shadow-lg shadow-green-500/10"
                    : status === "error"
                    ? "bg-red-500 text-white font-bold"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20"
                }`}
              >
                {status === "saving" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Guardando…</span>
                  </>
                ) : status === "ok" ? (
                  <>
                    <Check size={16} />
                    <span>✓ ¡Guardado Exitoso!</span>
                  </>
                ) : status === "error" ? (
                  <>
                    <AlertTriangle size={16} />
                    <span>Error - Reintentar</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Guardar Calificaciones</span>
                  </>
                )}
              </button>

              {status === "ok" && (
                <span className="text-xs text-green-400 font-semibold animate-pulse">
                  Calificaciones registradas correctamente en el sistema.
                </span>
              )}
              {status === "error" && (
                <span className="text-xs text-red-400 font-semibold">
                  Hubo un error de conexión, por favor intenta de nuevo.
                </span>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
