import { supabase } from "../../../lib/supabaseClient";
import PlayerCard from "../../../components/PlayerCard";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getResultadoPartido(equipoJugador, goles1, goles2, estado) {
  if (estado !== "finalizado") return null;
  if (!equipoJugador) return null;

  if (goles1 === goles2) return "empate";

  const ganoEquipo1 = goles1 > goles2;

  if ((equipoJugador === 1 && ganoEquipo1) || (equipoJugador === 2 && !ganoEquipo1)) {
    return "victoria";
  }

  return "derrota";
}

function getResultadoStyles(resultado) {
  if (resultado === "victoria") {
    return {
      card: "bg-green-50 border-green-100",
      badge: "bg-green-100 text-green-700",
      label: "Victoria",
    };
  }

  if (resultado === "derrota") {
    return {
      card: "bg-red-50 border-red-100",
      badge: "bg-red-100 text-red-700",
      label: "Derrota",
    };
  }

  if (resultado === "empate") {
    return {
      card: "bg-yellow-50 border-yellow-100",
      badge: "bg-yellow-100 text-yellow-700",
      label: "Empate",
    };
  }

  return {
    card: "bg-white border-gray-100",
    badge: "bg-gray-100 text-gray-600",
    label: "Sin resultado",
  };
}

export default async function JugadorDetalle({ params }) {
  if (!supabase) return notFound();

  const [{ data: perfil }, { data: historialRaw }] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", params.id).single(),
    supabase
      .from("inscripciones")
      .select(
        "partido_id, goles, asistencias, equipo, partidos(cancha, fecha, hora, estado, goles_equipo1, goles_equipo2)"
      )
      .eq("usuario_id", params.id)
      .order("partido_id", { ascending: false })
      .limit(10),
  ]);

  if (!perfil) return notFound();

  const historial = (historialRaw || []).map((h) => {
    const resultado = getResultadoPartido(
      h.equipo,
      h.partidos?.goles_equipo1 ?? 0,
      h.partidos?.goles_equipo2 ?? 0,
      h.partidos?.estado
    );

    return {
      ...h,
      resultado,
      styles: getResultadoStyles(resultado),
    };
  });

  const st = {
    media_general: perfil.media_general ?? 65,
    ritmo: perfil.ritmo ?? 65,
    tiro: perfil.tiro ?? 63,
    pase: perfil.pase ?? 62,
    regate: perfil.regate ?? 65,
    defensa: perfil.defensa ?? 40,
    fisico: perfil.fisico ?? 63,
    nivel: perfil.nivel ?? 1,
    partidos_jugados: perfil.partidos_jugados ?? 0,
    goles_total: perfil.goles_total ?? 0,
    asistencias_total: perfil.asistencias_total ?? 0,
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/jugadores" className="text-sm text-cancha-verde hover:underline">
        ← Volver a jugadores
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        <PlayerCard
          nombre={perfil.nombre || "Jugador"}
          posicion={perfil.posicion || "MED"}
          media={st.media_general}
          stats={{
            ritmo: st.ritmo,
            tiro: st.tiro,
            pase: st.pase,
            regate: st.regate,
            defensa: st.defensa,
            fisico: st.fisico,
          }}
          nivel={st.nivel}
          partidosJugados={st.partidos_jugados}
          goles={st.goles_total}
          asistencias={st.asistencias_total}
          avatar={perfil.avatar_url}
        />

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h2 className="font-bold text-gray-800 text-lg">{perfil.nombre || "Jugador"}</h2>
            <p className="text-gray-500 text-sm mt-1">{perfil.posicion || "Sin posición"}</p>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Partidos", value: st.partidos_jugados },
                { label: "Goles", value: st.goles_total },
                { label: "Asistencias", value: st.asistencias_total },
              ].map(({ label, value }) => (
                <div key={label} className="bg-cancha-gris rounded-xl p-3 text-center">
                  <div className="font-black text-cancha-verdeoscuro text-xl">{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Últimos partidos</h3>

            {!historial || historial.length === 0 ? (
              <p className="text-sm text-gray-400">Sin partidos jugados aún.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {historial.map((h, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between text-sm py-3 px-3 rounded-xl border ${h.styles.card} last:border-b`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-700">{h.partidos?.cancha}</p>

                        {h.resultado && (
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${h.styles.badge}`}
                          >
                            {h.styles.label}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-400 mt-1">
                        {h.partidos?.fecha} · {h.partidos?.hora}
                      </p>

                      {h.partidos?.estado === "finalizado" && (
                        <p className="text-[11px] text-gray-500 mt-1">
                          Resultado: {h.partidos?.goles_equipo1 ?? 0} - {h.partidos?.goles_equipo2 ?? 0}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 text-xs shrink-0">
                      <span className="font-bold text-cancha-verde">{h.goles || 0} ⚽</span>
                      <span className="font-bold text-blue-500">{h.asistencias || 0} 🎯</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}