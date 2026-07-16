"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargar() {
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

      const { data } = await supabase
        .from("perfiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setPerfil(data);
      setCargando(false);
    }
    cargar();
  }, []);

  if (cargando) {
    return <p className="text-sm text-gray-500">Cargando...</p>;
  }

  if (!perfil) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-sm text-gray-500">
          Inicia sesión para ver tu perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Mi perfil</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-cancha-verde/20 flex items-center justify-center text-cancha-verdeoscuro font-semibold">
          {perfil.nombre ? perfil.nombre.slice(0, 2).toUpperCase() : "?"}
        </div>
        <div>
          <p className="font-semibold">{perfil.nombre || "Sin nombre"}</p>
          <p className="text-sm text-gray-500">{perfil.telefono}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-2">Historial de partidos</h2>
        <p className="text-sm text-gray-500">
          Todavía no has jugado ningún partido. Cuando juegues tu primer
          partido, aquí aparecerán tus estadísticas.
        </p>
      </div>
    </div>
  );
}
