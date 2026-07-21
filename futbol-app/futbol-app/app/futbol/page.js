"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import PartidoCard from "../../components/PartidoCard";
import Link from "next/link";

export default function FutbolPage() {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarPartidos() {
      if (!supabase) {
        setCargando(false);
        return;
      }

      const { data, error } = await supabase
        .from("partidos")
        .select("*, inscripciones(count)")
        .eq("deporte", "futbol") // clave para el hub
        .order("fecha", { ascending: true });

      if (error) {
        console.error("ERROR PARTIDOS FUTBOL:", error);
        setPartidos([]);
        setCargando(false);
        return;
      }

      setPartidos(data || []);
      setCargando(false);
    }

    cargarPartidos();
  }, []);

  if (cargando) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        Cargando partidos de fútbol...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header con botón para volver al hub */}
      <header className="flex items-center justify-between p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold">Partidos de Fútbol</h1>
        <Link
          href="/"
          className="text-sm px-3 py-2 rounded bg-gray-700 hover:bg-gray-600"
        >
          Volver al hub
        </Link>
      </header>

      {/* Lista de partidos */}
      <section className="p-4 grid gap-4">
        {partidos.length === 0 ? (
          <p>No hay partidos de fútbol disponibles.</p>
        ) : (
          partidos.map((partido) => (
            <PartidoCard key={partido.id} partido={partido} />
          ))
        )}
      </section>
    </main>
  );
}
