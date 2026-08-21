"use client";

import { supabase } from "@/lib/supabase";
import { Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Votar() {
  const router = useRouter();

  const [seleccionado, setSeleccionado] = useState("miss");
  const [user, setUser] = useState<null | any>(null);
  const [concursantes, setConcursantes] = useState<any[]>([]);
  const [criterios, setCriterios] = useState<any[]>([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.replace("/login");
        return;
      }
      setUser(sessionData.session.user);

      const [{ data: c }, { data: cr }, { data: v }] = await Promise.all([
        supabase
          .from("concursantes")
          .select("*")
          .eq("activo", true)
          .eq("categoria", seleccionado)
          .order("numero"),
        supabase.from("criterios").select("*").order("orden"),
        supabase
          .from("votos")
          .select("*")
          .eq("juez_id", sessionData.session.user.id),
      ]);

      setConcursantes(c || []);
      setCriterios(cr || []);

      const initialScores = {};
      (v || []).forEach((row) => {
        initialScores[`${row.concursante_id}_${row.criterio_id}`] = row.puntaje;
      });
      setScores(initialScores);
      setLoading(false);
    };

    init();
  }, [router, seleccionado]);

  const categorias = [
    {
      value: "miss",
      label: "Miss",
    },
    {
      value: "mister",
      label: "Mister",
    },
    {
      value: "cholita",
      label: "Cholita",
    },
    {
      value: "nusta",
      label: "Ñusta",
    },
    {
      value: "chasqui",
      label: "Chasqui",
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div>
      <nav className="flex py-2 px-4 md:px-8 bg-white border-b border-slate-300 min-h-17 relative z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-4 w-full">
          {/* MENÚ */}
          <div
            id="collapseMenu"
            className={`${
              menuOpen ? "block" : "hidden"
            } z-50 outline-none lg:block max-lg:bg-white max-lg:border-l max-lg:border-slate-300 max-lg:w-1/2 max-lg:fixed max-lg:top-0 max-lg:right-0 max-lg:h-full max-lg:shadow-md max-lg:overflow-auto max-sm:w-full`}
          >
            {/* Botón cerrar en móvil */}
            <div className="flex justify-end p-4 lg:hidden">
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Cerrar menú"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex flex-col gap-8 font-semibold text-sm text-slate-900 lg:flex-row max-lg:p-6 lg:ml-12">
              {categorias.map((categoria) => (
                <div
                  key={categoria.value}
                  onClick={() => {
                    setSeleccionado(categoria.value);
                    setMenuOpen(false);
                  }}
                  className={`px-4 rounded-b-md cursor-pointer ${
                    seleccionado === categoria.value
                      ? "border-b-2 border-blue-500"
                      : "hover:border-b-2 hover:border-blue-500"
                  }`}
                >
                  <div className="text-[16px]">{categoria.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center w-full justify-between">
            {/* USUARIO */}
            <div className="row p-1 items-center md:ml-auto">
              <div className="text-sm text-blue-800">{user?.email}</div>

              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-xl text-sm"
                onClick={handleLogout}
                style={{ marginTop: 8 }}
              >
                Cerrar sesión
              </button>
            </div>

            {/* BOTÓN MENÚ */}
            <button
              className="lg:hidden p-2 "
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
            >
              <Menu size={30} />
            </button>
          </div>
        </div>
      </nav>

      {concursantes.length === 0 && (
        <div className="text-center m-5 py-5 px-5 mt-10 text-sm border border-dashed rounded-lg text-gray-400">
          Todavía no hay concursantes cargados. Pedile al administrador que los
          agregue concursantes.
        </div>
      )}

      {/* CONTENIDO */}

      {concursantes.length > 0 && (
        <div>
          <div className="m-5 md:py-5 py-2 md:px-5 px-2 mt-8">
            <span className="font-mono text-xs tracking-[0.18em] uppercase text-blue-700 mb-2.5 block">
              PANEL DE JURADO
            </span>
            <h1 className="text-2xl font-medium">Emitir puntajes</h1>
          </div>
          <div className="flex items-center gap-4 w-full md:px-10 px-5">
            <span className="px-4 py-2 rounded-md text-base font-medium bg-sky-50 text-sky-700 border border-sky-200">
              {
                categorias.find((categoria) => categoria.value === seleccionado)
                  ?.label
              }
            </span>
            <div className="flex-1 h-px bg-sky-300" />
          </div>
          {/* EVALUAR ENTRAR CANDIDATA */}
          <div className="md:px-10 px-5">
            <div className="bg-white border border-slate-200 shadow-sm w-full max-w-sm rounded-lg mt-6 overflow-hidden">
              <div className="aspect-3/2 w-full flex items-center justify-center">
                <Image
                  src="/invitacion.jpeg"
                  className="w-full h-full object-cover"
                  alt="login image"
                  width={200}
                  height={800}
                />
              </div>

              <div className="p-4">
                <div>
                  <h3 className="text-slate-900 text-lg font-medium">
                    Candelaria Molfese
                  </h3>

                  <div className="mt-3 flex justify-between items-center gap-4 flex-wrap">
                    <span className="text-xl text-slate-900 font-bold">
                      5.56 pts
                    </span>
                    <a
                      href="#"
                      className="inline-block py-2 px-3.5 text-sm rounded-md font-semibold cursor-pointer text-white border border-blue-600 bg-blue-600 hover:bg-blue-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      Evaluar
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
