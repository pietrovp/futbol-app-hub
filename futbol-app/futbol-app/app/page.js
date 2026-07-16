import PartidoCard from "../components/PartidoCard";
import { supabase } from "../lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  let partidos = [];


  if (supabase) {
    const { data } = await supabase
      .from("partidos")
      .select("*, inscripciones(count)")
      .order("fecha", { ascending: true });
    partidos = data || [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Partidos disponibles</h1>
        <p className="text-gray-500 text-sm">
          Únete a un partido en Barquisimeto, con o sin equipo.
        </p>
      </div>

      <div className="grid gap-4">
        {partidos.length === 0 && (
          <p className="text-sm text-gray-500">
            Todavía no hay partidos publicados.
          </p>
        )}
        {partidos.map((partido) => (
          <PartidoCard
            key={partido.id}
            partido={{
              id: partido.id,
              cancha: partido.cancha,
              zona: partido.zona,
              fecha: partido.fecha,
              hora: partido.hora,
              cuposTotales: partido.cupos_totales,
              cuposOcupados: partido.inscripciones?.[0]?.count || 0,
              precio: partido.precio,
            }}
          />
        ))}
      </div>
    </div>
  );
}
