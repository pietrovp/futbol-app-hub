"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function PartidoCard({ partido }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cuposLibres = partido.cuposTotales - partido.cuposOcupados;
  const lleno = cuposLibres <= 0;

  async function unirse() {
    if (!supabase) return;
    setCargando(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMensaje("Primero inicia sesión para unirte.");
      setCargando(false);
      return;
    }

    const { error } = await supabase
      .from("inscripciones")
      .insert({ partido_id: partido.id, usuario_id: user.id });

    setCargando(false);

    if (error) {
      setMensaje("No se pudo unir al partido.");
    } else {
      setMensaje("¡Te uniste al partido!");
      router.refresh();
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{partido.cancha}</h3>
          <p className="text-sm text-gray-500">{partido.zona}</p>
        </div>
        <span className="text-sm font-medium bg-cancha-verde/10 text-cancha-verdeoscuro px-2 py-1 rounded-md">
          ${partido.precio}
        </span>
      </div>

      <p className="text-sm text-gray-600">
        {partido.fecha} · {partido.hora}
      </p>

      <p className="text-sm">
        {lleno ? (
          <span className="text-red-600 font-medium">Cupo lleno</span>
        ) : (
          <span className="text-cancha-verdeoscuro font-medium">
            {cuposLibres} cupos libres de {partido.cuposTotales}
          </span>
        )}
      </p>

      <button
        disabled={lleno || cargando}
        onClick={unirse}
        className={`mt-2 w-full rounded-lg py-2 text-sm font-medium transition ${
          lleno || cargando
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-cancha-verde text-white hover:bg-cancha-verdeoscuro"
        }`}
      >
        {lleno ? "Sin cupo" : cargando ? "Uniendo..." : "Unirme y pagar"}
      </button>

      {mensaje && <p className="text-xs text-gray-500">{mensaje}</p>}

      <Link
        href={`/partido/${partido.id}`}
        className="text-xs text-cancha-verdeoscuro underline text-center"
      >
        Ver jugadores confirmados
      </Link>
    </div>
  );
}
