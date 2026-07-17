import Link from "next/link";
import { supabase } from "../../../lib/supabaseClient";
import AccionesPartido from "../../../components/AccionesPartido";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DIAS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function formatFechaLarga(fechaStr) {
  if (!fechaStr) return "";
  const d = new Date(fechaStr + "T00:00:00");
  return DIAS[d.getDay()] + " " + d.getDate() + " de " + MESES[d.getMonth()];
}

function formatHora(horaStr) {
  if (!horaStr) return "";
  const partes = horaStr.split(":");
  const h = partes[0];
  const m = partes[1];
  const hora = parseInt(h, 10);
  const ampm = hora >= 12 ? "PM" : "AM";
  const hora12 = hora % 12 === 0 ? 12 : hora % 12;
  return hora12 + ":" + m + " " + ampm;
}

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
      .select("id, usuario_id, goles, asistencias")
      .eq("partido_id", id);

    const idsUsuarios = (inscripcionesData || []).map((i) => i.usuario_id);

    let perfilesData = [];
    if (idsUsuarios.length > 0) {
      const { data } = await supabase
        .from("perfiles")
        .select("id, nombre, posicion, nivel, media_general")
        .in("id", idsUsuarios);

      perfilesData = data || [];
    }

    inscritos = (inscripcionesData || []).map((i) => {
      const perfil = perfilesData.find((p) => p.id === i.usuario_id);

      return {
        id: i.id,
        nombre: perfil?.nombre || "Jugador",
        posicion: perfil?.posicion || "MED",
        media: perfil?.media_general || 65,
        nivel: perfil?.nivel || 1,
        avatarUrl: null,
      };
    });
  }

  if (!partido) {
    return <p className="text-sm text-gray-500">Partido no encontrado.</p>;
  }

  const cuposLibres = partido.cupos_totales - inscritos.length;
  const ocupacion = Math.round((inscritos.length / partido.cupos_totales) * 100);

  const coloresPosicion = {
    POR: "bg-yellow-100 text-yellow-700",
    DEF: "bg-blue-100 text-blue-700",
    MED: "bg-green-100 text-green-700",
    DEL: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="text-sm text-cancha-verde hover:underline w-fit">
        Volver a partidos
      </Link>

      <div className="relative rounded-3xl overflow-hidden h-48 md:h-56 bg-gradient-to-br from-cancha-verdeoscuro via-cancha-verde to-emerald-600">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:16px_16px]" />
        <div className="absolute top-4 left-5 flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="text-white text-xs font-bold tracking-wide">UBICACION</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/50 to-transparent">
          <h1 className="text-2xl md:text-3xl font-black text-white">{partido.cancha}</h1>
          <p className="text-white/80 text-sm">{partido.zona}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col items-center text-center">
          <p className="text-xs text-gray-400 mt-1">Fecha</p>
          <p className="font-bold text-gray-800 text-sm">{formatFechaLarga(partido.fecha)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-col items-center text-center">
          <p className="text-xs text-gray-400 mt-1">Hora</p>
          <p className="font-bold text-gray-800 text-sm">{formatHora(partido.hora)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex flex-col gap-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-gray-700">
              {cuposLibres > 0 ? cuposLibres + " cupos libres" : "Cupo lleno"}
            </span>
            <span className="text-gray-500">{inscritos.length}/{partido.cupos_totales}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className={
                "h-2.5 rounded-full transition-all " +
                (cuposLibres <= 0 ? "bg-red-400" : ocupacion > 70 ? "bg-yellow-400" : "bg-cancha-verde")
              }
              style={{ width: Math.min(ocupacion, 100) + "%" }}
            />
          </div>
        </div>

        <AccionesPartido partidoId={partido.id} cuposLibres={cuposLibres} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h2 className="font-bold text-gray-800 mb-4">
          Jugadores confirmados ({inscritos.length})
        </h2>

        {inscritos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Todavia nadie se ha unido a este partido.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {inscritos.map((jugador) => (
              <div
                key={jugador.id}
                className="flex items-center gap-3 bg-cancha-gris rounded-xl p-3"
              >
                {jugador.avatarUrl ? (
                  <img
                    src={jugador.avatarUrl}
                    alt={jugador.nombre}
                    className="w-11 h-11 rounded-full object-cover border-2 border-cancha-verde/30"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-cancha-verde/20 flex items-center justify-center font-bold text-cancha-verdeoscuro">
                    {jugador.nombre.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{jugador.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={
                        "text-xs font-bold px-2 py-0.5 rounded-full " +
                        (coloresPosicion[jugador.posicion] || "bg-gray-100 text-gray-600")
                      }
                    >
                      {jugador.posicion}
                    </span>
                    <span className="text-xs text-gray-500">Nivel {jugador.nivel}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-cancha-verdeoscuro">{jugador.media}</p>
                  <p className="text-[10px] text-gray-400 -mt-1">MEDIA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
