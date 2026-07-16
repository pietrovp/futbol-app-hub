import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";

export const dynamic = "force-dynamic";

export default async function DetallePartido({ params }) {
  const { id } = params;

  let partido = null;
  let inscritos = [];

  if (supabase) {
    const { data: partidoData } = await supabase
      .from("partidos")
      .select("*")
      .eq("id", id)
      .single();
    partido = partidoData;

    const { data: inscripcionesData } = await supabase
      .from("inscripciones")
      .select("id, perfiles(nombre)")
      .eq("partido_id", id);
    inscritos = inscripcionesData || [];
  }

  if (!partido) {
    return <p className="text-sm text-gray-500">Partido no encontrado.</p>;
  }

  const cuposLibres = partido.cupos_totales - inscritos.length;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-sm text-cancha-verdeoscuro underline">
        ← Volver a partidos
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{partido.cancha}</h1>
        <p className="text-gray-500 text-sm">{partido.zona}</p>
        <p className="text-sm text-gray-600 mt-1">
          {partido.fecha} · {partido.hora}
        </p>
      </div>

      <p className="text-sm">
        {cuposLibres > 0 ? (
          <span className="text-cancha-verdeoscuro font-medium">
            {cuposLibres} cupos libres de {partido.cupos_totales}
          </span>
        ) : (
          <span className="text-red-600 font-medium">Cupo lleno</span>
        )}
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold mb-3">
          Jugadores confirmados ({inscritos.length})
        </h2>
        {inscritos.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía nadie se ha unido a este partido.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {inscritos.map((i) => (
              <li key={i.id} className="text-sm text-gray-700">
                {i.perfiles?.nombre || "Jugador"}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
