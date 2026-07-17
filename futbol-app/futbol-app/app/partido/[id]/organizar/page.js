"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../../lib/supabaseClient";

export default function OrganizarPartido() {
  const router = useRouter();
  const params = useParams();
  const partidoId = params.id;

  const [partido, setPartido] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [goles, setGoles] = useState({});
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [autorizado, setAutorizado] = useState(false);

  async function cargarTodo() {
    if (!supabase) {
      setCargando(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCargando(false);
      return;
    }

    const { data: perfilUsuario } = await supabase
      .from("perfiles")
      .select("es_organizador")
      .eq("id", user.id)
      .single();

    if (!perfilUsuario?.es_organizador) {
      setCargando(false);
      return;
    }

    setAutorizado(true);

    const { data: partidoData } = await supabase
      .from("partidos")
      .select("*")
      .eq("id", partidoId)
      .single();

    setPartido(partidoData);

    const { data: inscripcionesData } = await supabase
      .from("inscripciones")
      .select("id, usuario_id, goles, equipo")
      .eq("partido_id", partidoId);

    const idsUsuarios = (inscripcionesData || []).map((i) => i.usuario_id);

    let perfilesData = [];
    if (idsUsuarios.length > 0) {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, posicion, media_general, avatar_url")
        .in("id", idsUsuarios);
      perfilesData = data || [];
    }

    const lista = (inscripcionesData || []).map((i) => {
      const perfil = perfilesData.find((p) => p.id === i.usuario_id);
      return {
        id: i.id,
        nombre: perfil?.nombre || "Jugador",
        posicion: perfil?.posicion || "MED",
        media: perfil?.media_general || 65,
        avatarUrl: perfil?.avatar_url || null,
        equipo: i.equipo || null,
        goles: i.goles || 0,
      };
    });

    setInscritos(lista);

    const golesIniciales = {};
    lista.forEach((j) => {
      golesIniciales[j.id] = j.goles;
    });
    setGoles(golesIniciales);

    setCargando(false);
  }

  useEffect(() => {
    cargarTodo();
  }, [partidoId]);

  async function cambiarEquipo(inscripcionId, nuevoEquipo) {
    setProcesando(true);
    const { error } = await supabase
      .from("inscripciones")
      .update({ equipo: nuevoEquipo })
      .eq("id", inscripcionId);

    if (error) {
      setMensaje("No se pudo mover al jugador: " + error.message);
    } else {
      setInscritos((prev) =>
        prev.map((j) => (j.id === inscripcionId ? { ...j, equipo: nuevoEquipo } : j))
      );
    }
    setProcesando(false);
  }

  async function comenzarPartido() {
    setProcesando(true);
    setMensaje("");

    const { error } = await supabase
      .from("partidos")
      .update({ estado: "en_curso" })
      .eq("id", partidoId);

    if (error) {
      setMensaje("No se pudo iniciar el partido: " + error.message);
      setProcesando(false);
      return;
    }

    setPartido((prev) => ({ ...prev, estado: "en_curso" }));
    setProcesando(false);
  }

  async function guardarResultado(e) {
    e.preventDefault();
    setProcesando(true);
    setMensaje("");

    const updates = inscritos.map((jugador) =>
      supabase
        .from("inscripciones")
        .update({ goles: Number(goles[jugador.id]) || 0 })
        .eq("id", jugador.id)
    );

    const resultados = await Promise.all(updates);
    const conError = resultados.find((r) => r.error);

    if (conError) {
      setMensaje("No se pudo guardar: " + conError.error.message);
      setProcesando(false);
      return;
    }

    const golesEquipo1 = inscritos
      .filter((j) => j.equipo === 1)
      .reduce((acc, j) => acc + (Number(goles[j.id]) || 0), 0);

    const golesEquipo2 = inscritos
      .filter((j) => j.equipo === 2)
      .reduce((acc, j) => acc + (Number(goles[j.id]) || 0), 0);

    const { error } = await supabase
      .from("partidos")
      .update({
        goles_equipo1: golesEquipo1,
        goles_equipo2: golesEquipo2,
        estado: "finalizado",
      })
      .eq("id", partidoId);

    if (error) {
      setMensaje("No se pudo finalizar: " + error.message);
      setProcesando(false);
      return;
    }

    await cargarTodo();
    setProcesando(false);
  }

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin text-4xl">⚽</div>
      </div>
    );
  }

  if (!autorizado) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="text-5xl">🔒</div>
        <h1 className="text-xl font-bold text-gray-800">No tienes acceso a este panel</h1>
        <p className="text-gray-500 text-sm max-w-sm">
          Solo los organizadores pueden gestionar los equipos y el resultado de este partido.
        </p>
        <Link href={`/partidos/${partidoId}`} className="text-cancha-verde text-sm hover:underline">
          Volver al partido
        </Link>
      </div>
    );
  }

  if (!partido) {
    return <p className="text-sm text-gray-500">Partido no encontrado.</p>;
  }

  const equipo1 = inscritos.filter((j) => j.equipo === 1);
  const equipo2 = inscritos.filter((j) => j.equipo === 2);

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/partidos/${partidoId}`} className="text-sm text-cancha-verde hover:underline w-fit">
        ← Volver al partido
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-800">{partido.cancha}</h1>
        <p className="text-sm text-gray-500">{partido.zona}</p>
      </div>

      {partido.estado === "finalizado" && (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 flex flex-col items-center gap-2">
          <p className="text-xs font-bold text-gray-400 uppercase">Resultado final</p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-600">Equipo 1</span>
            <span className="text-5xl font-black text-cancha-verdeoscuro">
              {partido.goles_equipo1 ?? 0} - {partido.goles_equipo2 ?? 0}
            </span>
            <span className="text-sm font-semibold text-gray-600">Equipo 2</span>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {[{ label: "Equipo 1", lista: equipo1, num: 1 }, { label: "Equipo 2", lista: equipo2, num: 2 }].map(
          (grupo) => (
            <div key={grupo.num} className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
              <h2 className="font-bold text-gray-800 mb-3">{grupo.label}</h2>
              <div className="flex flex-col gap-2">
                {grupo.lista.map((jugador) => (
                  <div
                    key={jugador.id}
                    className="flex items-center justify-between bg-cancha-gris rounded-xl p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-cancha-verde/20 flex items-center justify-center text-xs font-bold text-cancha-verdeoscuro">
                        {jugador.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{jugador.nombre}</span>
                    </div>

                    {partido.estado === "equipos_listos" && (
                      <button
                        onClick={() => cambiarEquipo(jugador.id, grupo.num === 1 ? 2 : 1)}
                        disabled={procesando}
                        className="text-xs text-cancha-verde font-semibold hover:underline"
                      >
                        {grupo.num === 1 ? "→ Equipo 2" : "→ Equipo 1"}
                      </button>
                    )}

                    {partido.estado === "en_curso" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Goles</span>
                        <input
                          type="number"
                          min="0"
                          value={goles[jugador.id] ?? 0}
                          onChange={(e) =>
                            setGoles((prev) => ({ ...prev, [jugador.id]: e.target.value }))
                          }
                          className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-sm text-center"
                        />
                      </div>
                    )}

                    {partido.estado === "finalizado" && (
                      <span className="text-sm font-bold text-cancha-verdeoscuro">
                        {jugador.goles} goles
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {partido.estado === "equipos_listos" && (
        <button
          onClick={comenzarPartido}
          disabled={procesando}
          className="rounded-xl py-3.5 text-sm font-bold bg-cancha-verde text-white hover:bg-cancha-verdeoscuro transition disabled:opacity-50"
        >
          {procesando ? "Iniciando..." : "▶️ Comenzar partido"}
        </button>
      )}

      {partido.estado === "en_curso" && (
        <form onSubmit={guardarResultado}>
          <button
            type="submit"
            disabled={procesando}
            className="w-full rounded-xl py-3.5 text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
          >
            {procesando ? "Guardando..." : "🏁 Finalizar partido"}
          </button>
        </form>
      )}

      {mensaje && <p className="text-sm text-gray-500 text-center">{mensaje}</p>}
    </div>
  );
}