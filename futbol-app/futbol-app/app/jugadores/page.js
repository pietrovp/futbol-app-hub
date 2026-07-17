"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import PlayerCard from "../../components/PlayerCard";
import Link from "next/link";

export default function Jugadores() {
  const [jugadores, setJugadores] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [posicionFiltro, setPosicionFiltro] = useState("TODOS");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
      if (!supabase) { setCargando(false); return; }
      const { data, error } = await supabase
        .from("perfiles")
        .select("id, nombre, posicion, nivel")
        .order("nombre");
      if (error) console.error("ERROR JUGADORES:", error);
      setJugadores(data || []);
      setCargando(false);
    }
    cargar();
  }, []);

  const posiciones = ["TODOS", "DEL", "MED", "DEF", "POR"];

  const filtrados = jugadores.filter((j) => {
    const nombreMatch = j.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const posMatch = posicionFiltro === "TODOS" || j.posicion === posicionFiltro;
    return nombreMatch && posMatch;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Jugadores</h1>
        <p className="text-gray-500 text-sm">Descubre y conoce a los jugadores de la comunidad</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍  Buscar jugador..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cancha-verde"
        />
        <div className="flex gap-2 flex-wrap">
          {posiciones.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosicionFiltro(pos)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                posicionFiltro === pos
                  ? "bg-cancha-verde text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-cancha-verde"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin text-4xl">⚽</div>
        </div>
      ) : filtrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-card">
          <div className="text-4xl mb-2">🔍</div>
          <p>No se encontraron jugadores.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtrados.map((j) => (
            <Link key={j.id} href={`/jugadores/${j.id}`} className="hover:scale-105 transition-transform">
              <PlayerCard
                mini
                nombre={j.nombre || "Jugador"}
                posicion={j.posicion || "MED"}
                media={65}
                nivel={j.nivel || 1}
                avatar={null}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}