"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

function resolverResultado(equipo, golesEquipo1, golesEquipo2) {
  if (!equipo) return null;

  if (golesEquipo1 === golesEquipo2) {
    return {
      tipo: "empate",
      titulo: "Empataste este partido",
      clases: "bg-yellow-50 border-yellow-100 text-yellow-800",
      emoji: "🟨",
    };
  }

  const ganoEquipo1 = golesEquipo1 > golesEquipo2;
  const ganoJugador =
    (equipo === 1 && ganoEquipo1) || (equipo === 2 && !ganoEquipo1);

  if (ganoJugador) {
    return {
      tipo: "victoria",
      titulo: "Ganaste este partido",
      clases: "bg-green-50 border-green-100 text-green-800",
      emoji: "🟢",
    };
  }

  return {
    tipo: "derrota",
    titulo: "Perdiste este partido",
    clases: "bg-red-50 border-red-100 text-red-800",
    emoji: "🔴",
  };
}

export default function EstadoMiPartido({ partidoId, golesEquipo1, golesEquipo2, estado }) {
  const [cargando, setCargando] = useState(true);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    async function cargarResultado() {
      if (!supabase || estado !== "finalizado") {
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

      const { data: inscripcion } = await supabase
        .from("inscripciones")
        .select("equipo")
        .eq("partido_id", partidoId)
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (!inscripcion) {
        setCargando(false);
        return;
      }

      const res = resolverResultado(
        inscripcion.equipo,
        golesEquipo1 ?? 0,
        golesEquipo2 ?? 0
      );

      setResultado(res);
      setCargando(false);
    }

    cargarResultado();
  }, [partidoId, golesEquipo1, golesEquipo2, estado]);

  if (cargando || !resultado) return null;

  return (
    <div className={`rounded-2xl border px-4 py-3 ${resultado.clases}`}>
      <p className="text-sm font-bold">
        {resultado.emoji} {resultado.titulo}
      </p>
    </div>
  );
}
