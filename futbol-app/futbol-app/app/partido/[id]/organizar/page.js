"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "../../../../lib/supabaseClient";
import { cumpleRequisito } from "../../../../lib/logros";

function iniciales(nombre) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function colorWinRate(pct) {
  if (pct >= 55) return "bg-green-50 text-green-700 border-green-100";
  if (pct >= 35) return "bg-yellow-50 text-yellow-700 border-yellow-100";
  return "bg-red-50 text-red-700 border-red-100";
}

function promedioMedia(lista) {
  if (!lista.length) return 0;
  return Math.round(lista.reduce((acc, j) => acc + j.media, 0) / lista.length);
}

// Reparte jugadores buscando que la suma de "media" quede lo más pareja posible
function balancearEquipos(jugadores) {
  const ordenados = [...jugadores].sort((a, b) => b.media - a.media);
  const equipo1 = [];
  const equipo2 = [];
  let suma1 = 0;
  let suma2 = 0;

  ordenados.forEach((j) => {
    if (suma1 <= suma2) {
      equipo1.push(j.id);
      suma1 += j.media;
    } else {
      equipo2.push(j.id);
      suma2 += j.media;
    }
  });

  return { equipo1, equipo2 };
}

function JugadorCard({ jugador, modo, onCambiarEquipo, valorGol, onGolChange, dragHandleProps, isDragging }) {
  const esNuevo = jugador.partidosJugados === 0;
  const golesPromedio = esNuevo ? null : (jugador.golesTotal / jugador.partidosJugados).toFixed(2);

  return (
    <div
      className={`flex items-center gap-3 bg-white rounded-2xl border p-3 transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-cancha-verde/40 border-cancha-verde/30" : "shadow-sm border-gray-100"
      }`}
    >
      {modo === "armar" && (
        <button
          {...dragHandleProps}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-400 touch-none p-1 -ml-1 shrink-0"
          aria-label="Arrastrar para mover de equipo"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-5" fill="currentColor">
            <circle cx="8" cy="6" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
            <circle cx="8" cy="18" r="1.5" />
            <circle cx="16" cy="6" r="1.5" />
            <circle cx="16" cy="12" r="1.5" />
            <circle cx="16" cy="18" r="1.5" />
          </svg>
        </button>
      )}

      <div className="w-10 h-10 rounded-full bg-cancha-verde/15 flex items-center justify-center text-xs font-black text-cancha-verdeoscuro shrink-0 overflow-hidden">
        {jugador.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={jugador.avatarUrl} alt={jugador.nombre} className="w-full h-full object-cover" />
        ) : (
          iniciales(jugador.nombre)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 truncate">{jugador.nombre}</p>

        {esNuevo ? (
          <span className="inline-block mt-1 text-[10px] font-bold text-cancha-verdeoscuro bg-cancha-verde/10 rounded-full px-2 py-0.5">
            NUEVO
          </span>
        ) : (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {jugador.partidosJugados} PJ
            </span>
            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
              {golesPromedio} GPP
            </span>
            <span
              className={`text-[10px] font-bold rounded-full px-2 py-0.5 border ${colorWinRate(jugador.winRate)}`}
            >
              {jugador.winRate}% PG
            </span>
          </div>
        )}
      </div>

      {modo === "armar" && onCambiarEquipo && (
        <button
          onClick={onCambiarEquipo}
          className="text-sm font-semibold text-gray-300 hover:text-cancha-verde shrink-0"
          title="Mover al otro equipo"
        >
          ⇄
        </button>
      )}

      {modo === "jugando" && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] text-gray-400">Goles</span>
          <input
            type="number"
            min="0"
            value={valorGol ?? 0}
            onChange={onGolChange}
            className="w-12 rounded-lg border border-gray-200 px-2 py-1 text-sm text-center"
          />
        </div>
      )}

      {modo === "resultado" && (
        <span className="text-sm font-black text-cancha-verdeoscuro shrink-0">{jugador.goles} ⚽</span>
      )}
    </div>
  );
}

function JugadorDraggable({ jugador, modo, onCambiarEquipo, valorGol, onGolChange }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: jugador.id,
    disabled: modo !== "armar",
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : "auto", position: "relative" }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "opacity-50" : ""}>
      <JugadorCard
        jugador={jugador}
        modo={modo}
        onCambiarEquipo={onCambiarEquipo}
        valorGol={valorGol}
        onGolChange={onGolChange}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

function EquipoColumna({ id, titulo, jugadores, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-white rounded-2xl p-5 shadow-card border transition-colors ${
        isOver ? "border-cancha-verde bg-cancha-verde/5" : "border-gray-100"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800">{titulo}</h2>
        {jugadores.length > 0 && (
          <span className="text-xs font-semibold text-gray-400">
            Media: <span className="text-gray-700 font-bold">{promedioMedia(jugadores)}</span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 min-h-[70px]">
        {jugadores.length === 0 ? (
          <p className="text-xs text-gray-300 text-center py-4">Arrastra jugadores aquí</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

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
      .select("id, usuario_id, goles, asistencias, equipo")
      .eq("partido_id", partidoId);

    const idsUsuarios = (inscripcionesData || []).map((i) => i.usuario_id);

    let perfilesData = [];

    if (idsUsuarios.length > 0) {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, posicion, media_general, avatar_url, partidos_jugados, goles_total, win_rate")
        .in("id", idsUsuarios);
      perfilesData = data || [];
    }

    const lista = (inscripcionesData || []).map((i) => {
      const perfil = perfilesData.find((p) => p.id === i.usuario_id);

      return {
        id: i.id,
        usuario_id: i.usuario_id,
        nombre: perfil?.nombre || "Jugador",
        posicion: perfil?.posicion || "MED",
        media: perfil?.media_general || 65,
        avatarUrl: perfil?.avatar_url || null,
        equipo: i.equipo ?? null,
        goles: i.goles || 0,
        partidosJugados: perfil?.partidos_jugados ?? 0,
        golesTotal: perfil?.goles_total ?? 0,
        winRate: perfil?.win_rate ?? 0,
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

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    let targetEquipo;
    if (over.id === "equipo-1") targetEquipo = 1;
    else if (over.id === "equipo-2") targetEquipo = 2;
    else if (over.id === "equipo-null") targetEquipo = null;
    else return;

    const jugador = inscritos.find((j) => j.id === active.id);
    if (!jugador || jugador.equipo === targetEquipo) return;

    cambiarEquipo(jugador.id, targetEquipo);
  }

  async function sortearEquipos() {
    if (inscritos.length < 2) {
      setMensaje("Necesitas al menos 2 jugadores inscritos para sortear equipos.");
      return;
    }

    setProcesando(true);
    setMensaje("");

    const { equipo1, equipo2 } = balancearEquipos(inscritos);

    const updates = [
      ...equipo1.map((id) => supabase.from("inscripciones").update({ equipo: 1 }).eq("id", id)),
      ...equipo2.map((id) => supabase.from("inscripciones").update({ equipo: 2 }).eq("id", id)),
    ];

    const resultados = await Promise.all(updates);
    const conError = resultados.find((r) => r.error);

    if (conError) {
      setMensaje("No se pudo sortear: " + conError.error.message);
      setProcesando(false);
      return;
    }

    setInscritos((prev) => prev.map((j) => ({ ...j, equipo: equipo1.includes(j.id) ? 1 : 2 })));
    setMensaje("Equipos sorteados de forma equilibrada según su media.");
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

  async function recalcularEstadisticasJugador(usuarioId) {
    const { data: historial, error: historialError } = await supabase
      .from("inscripciones")
      .select("goles, asistencias, equipo, partidos(goles_equipo1, goles_equipo2, estado, fecha)")
      .eq("usuario_id", usuarioId)
      .order("fecha", { foreignTable: "partidos", ascending: true });

    if (historialError) return;

    const lista = historial || [];
    const partidos_jugados = lista.length;
    const goles_total = lista.reduce((acc, i) => acc + (i.goles || 0), 0);
    const asistencias_total = lista.reduce((acc, i) => acc + (i.asistencias || 0), 0);
    const max_goles_partido = lista.reduce((acc, i) => Math.max(acc, i.goles || 0), 0);

    let victorias = 0;
    let derrotas = 0;
    let empates = 0;
    let rachaActual = 0;
    let racha_victorias_max = 0;

    lista.forEach((i) => {
      if (i.partidos?.estado !== "finalizado" || !i.equipo) return;

      const g1 = i.partidos.goles_equipo1 ?? 0;
      const g2 = i.partidos.goles_equipo2 ?? 0;

      if (g1 === g2) {
        empates++;
        rachaActual = 0;
        return;
      }

      const ganoEquipo1 = g1 > g2;
      const gano = (i.equipo === 1 && ganoEquipo1) || (i.equipo === 2 && !ganoEquipo1);

      if (gano) {
        victorias++;
        rachaActual++;
        racha_victorias_max = Math.max(racha_victorias_max, rachaActual);
      } else {
        derrotas++;
        rachaActual = 0;
      }
    });

    const partidosDecisivos = victorias + derrotas;
    const win_rate = partidosDecisivos > 0 ? Math.round((victorias / partidosDecisivos) * 100) : 0;

    const statsParaLogros = {
      partidos_jugados,
      goles_total,
      victorias,
      max_goles_partido,
      racha_victorias_max,
    };

    // FIX: Obtener logros ya desbloqueados ANTES de insertar nuevos
    const { data: logrosActivos } = await supabase.from("logros").select("*").eq("activo", true);
    const { data: yaDesbloqueadosAntes } = await supabase
      .from("logros_desbloqueados")
      .select("logro_id, logros(stat_mejora, valor_mejora)")
      .eq("usuario_id", usuarioId);

    const idsDesbloqueados = new Set((yaDesbloqueadosAntes || []).map((d) => d.logro_id));
    const nuevosDesbloqueos = (logrosActivos || []).filter(
      (l) => !idsDesbloqueados.has(l.id) && cumpleRequisito(l, statsParaLogros)
    );

    // FIX: upsert con ignoreDuplicates para evitar insertar el mismo logro dos veces
    if (nuevosDesbloqueos.length > 0) {
      await supabase
        .from("logros_desbloqueados")
        .upsert(
          nuevosDesbloqueos.map((l) => ({ usuario_id: usuarioId, logro_id: l.id })),
          { onConflict: "usuario_id,logro_id", ignoreDuplicates: true }
        );
    }

    // FIX: Releer logros_desbloqueados DESPUÉS del upsert para tener la lista definitiva
    // y calcular el bono con datos frescos, evitando el doble conteo
    const { data: todosDesbloqueados } = await supabase
      .from("logros_desbloqueados")
      .select("logro_id, logros(stat_mejora, valor_mejora)")
      .eq("usuario_id", usuarioId);

    const bonoMediaTotal = (todosDesbloqueados || [])
      .filter((d) => d.logros?.stat_mejora === "media_general")
      .reduce((acc, d) => acc + (d.logros?.valor_mejora || 0), 0);

    const media_general = Math.min(
      99,
      65 + goles_total * 1 + asistencias_total * 0.5 + Math.floor(partidos_jugados / 3) + bonoMediaTotal
    );

    const updates = {
      partidos_jugados,
      goles_total,
      asistencias_total,
      max_goles_partido,
      racha_victorias_max,
      victorias,
      derrotas,
      empates,
      win_rate,
      media_general,
    };

    // Los demás atributos (ritmo, tiro, pase...) no tienen fórmula propia,
    // así que solo se les suma el bono de los logros recién desbloqueados
    const statsAdicionales = nuevosDesbloqueos.filter((l) => l.stat_mejora !== "media_general");

    if (statsAdicionales.length > 0) {
      const { data: perfilActual } = await supabase
        .from("perfiles")
        .select("ritmo, tiro, pase, regate, defensa, fisico")
        .eq("id", usuarioId)
        .single();

      const valoresActuales = { ...perfilActual };

      statsAdicionales.forEach((l) => {
        valoresActuales[l.stat_mejora] = Math.min(99, (valoresActuales[l.stat_mejora] ?? 65) + l.valor_mejora);
      });

      Object.assign(updates, valoresActuales);
    }

    await supabase.from("perfiles").update(updates).eq("id", usuarioId);
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

    const { error: partidoError } = await supabase
      .from("partidos")
      .update({
        goles_equipo1: golesEquipo1,
        goles_equipo2: golesEquipo2,
        estado: "finalizado",
      })
      .eq("id", partidoId);

    if (partidoError) {
      setMensaje("No se pudo finalizar: " + partidoError.message);
      setProcesando(false);
      return;
    }

    // FIX: Deduplicar por usuario_id para no procesar el mismo jugador dos veces
    // si hubiera inscripciones duplicadas en la lista
    const idsUnicos = [...new Set(inscritos.map((j) => j.usuario_id))];
    for (const usuarioId of idsUnicos) {
      await recalcularEstadisticasJugador(usuarioId);
    }

    await cargarTodo();
    setMensaje("Resultado guardado y estadísticas actualizadas.");
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
  const sinEquipo = inscritos.filter((j) => j.equipo == null);

  const modo =
    partido.estado === "equipos_listos"
      ? "armar"
      : partido.estado === "en_curso"
      ? "jugando"
      : "resultado";

  return (
    <div className="flex flex-col gap-6">
      <Link href={`/partidos/${partidoId}`} className="text-sm text-cancha-verde hover:underline w-fit">
        ← Volver al partido
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{partido.cancha}</h1>
          <p className="text-sm text-gray-500">{partido.zona}</p>
        </div>

        {partido.estado === "equipos_listos" && (
          <button
            onClick={sortearEquipos}
            disabled={procesando}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cancha-gris text-cancha-verdeoscuro text-sm font-bold hover:bg-cancha-verde/15 transition disabled:opacity-50"
          >
            🎲 Sortear equipos
          </button>
        )}
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

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {modo === "armar" && sinEquipo.length > 0 && (
          <EquipoColumna id="equipo-null" titulo="Sin equipo asignado" jugadores={sinEquipo}>
            {sinEquipo.map((jugador) => (
              <JugadorDraggable
                key={jugador.id}
                jugador={jugador}
                modo={modo}
                onCambiarEquipo={() => cambiarEquipo(jugador.id, 1)}
              />
            ))}
          </EquipoColumna>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <EquipoColumna id="equipo-1" titulo="Equipo 1" jugadores={equipo1}>
            {equipo1.map((jugador) => (
              <JugadorDraggable
                key={jugador.id}
                jugador={jugador}
                modo={modo}
                onCambiarEquipo={() => cambiarEquipo(jugador.id, 2)}
                valorGol={goles[jugador.id]}
                onGolChange={(e) => setGoles((prev) => ({ ...prev, [jugador.id]: e.target.value }))}
              />
            ))}
          </EquipoColumna>

          <EquipoColumna id="equipo-2" titulo="Equipo 2" jugadores={equipo2}>
            {equipo2.map((jugador) => (
              <JugadorDraggable
                key={jugador.id}
                jugador={jugador}
                modo={modo}
                onCambiarEquipo={() => cambiarEquipo(jugador.id, 1)}
                valorGol={goles[jugador.id]}
                onGolChange={(e) => setGoles((prev) => ({ ...prev, [jugador.id]: e.target.value }))}
              />
            ))}
          </EquipoColumna>
        </div>
      </DndContext>

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
