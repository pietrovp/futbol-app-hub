"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import PlayerCard from "../../components/PlayerCard";
import Link from "next/link";

const LOGROS_DEF = [
  {
    id: "primer_partido",
    icon: "⚽",
    label: "Primer partido",
    desc: "Juega tu primer partido",
    bonus: "+1 media",
    condicion: (s) => s.partidos_jugados >= 1,
  },
  {
    id: "veterano",
    icon: "🏆",
    label: "Veterano",
    desc: "Juega 10 partidos",
    bonus: "+5 media",
    condicion: (s) => s.partidos_jugados >= 10,
  },
  {
    id: "goleador",
    icon: "👑",
    label: "Goleador",
    desc: "Anota 10 goles en total",
    bonus: "+3 TIR",
    condicion: (s) => s.goles_total >= 10,
  },
];

function valor(...opciones) {
  for (const v of opciones) {
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        setErrorCarga("");

        if (!supabase) {
          setErrorCarga("Supabase no está disponible.");
          return;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error auth perfil:", userError);
          setErrorCarga("No se pudo validar la sesión.");
          return;
        }

        if (!user) return;

        setUserId(user.id);

        const { data: p, error: perfilError } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (perfilError) {
          console.error("Error perfil:", perfilError);
          setErrorCarga(perfilError.message || "No se pudo cargar el perfil.");
          return;
        }

        const partidos_jugados = Number(
          valor(p.partidosjugados, p.partidos_jugados, 0)
        );
        const goles_total = Number(
          valor(p.golestotal, p.goles_total, 0)
        );
        const victorias = Number(valor(p.victorias, 0));
        const derrotas = Number(valor(p.derrotas, 0));

        const promedio_goles =
          partidos_jugados > 0
            ? (goles_total / partidos_jugados).toFixed(2)
            : "0.00";

        const ratio_vd =
          derrotas > 0
            ? (victorias / derrotas).toFixed(2)
            : victorias > 0
            ? "∞"
            : "0.00";

        const perfilNormalizado = {
          ...p,
          nombre: valor(p.nombre, "Jugador"),
          telefono: valor(p.telefono, "Sin teléfono"),
          nacionalidad: valor(p.nacionalidad, null),
          posicion: valor(
            p.posicionpreferida,
            p.posicion_preferida,
            p.posicion,
            "MED"
          ),
          // mezcla mediageneral y media_general para soportar ambas
          media: Number(valor(p.mediageneral, p.media_general, 64)),
          avatar: valor(p.avatarurl, p.avatar_url, null),
          creditos: Number(valor(p.creditos, 0)),
        };

        setPerfil(perfilNormalizado);

        setStats({
          partidos_jugados,
          goles_total,
          media_general: perfilNormalizado.media, // esta será la media que ve PlayerCard
          ritmo: Number(valor(p.ritmo, 64)),
          tiro: Number(valor(p.tiro, 64)),
          pase: Number(valor(p.pase, 64)),
          regate: Number(valor(p.regate, 64)),
          defensa: Number(valor(p.defensa, 64)),
          fisico: Number(valor(p.fisico, 64)),
          victorias,
          derrotas,
          promedio_goles,
          ratio_vd,
        });
      } catch (error) {
        console.error("Error general perfil:", error);
        setErrorCarga("Ocurrió un error cargando el perfil.");
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  async function subirFoto(e) {
    const file = e.target.files?.[0];
    if (!file || !supabase || !userId) return;

    setMensajeFoto("");

    if (!file.type.startsWith("image/")) {
      setMensajeFoto("Solo puedes subir imágenes.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMensajeFoto("La imagen no puede pesar más de 2MB.");
      return;
    }

    try {
      setSubiendoFoto(true);

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setMensajeFoto(uploadError.message);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = publicUrlData?.publicUrl;
      if (!avatarUrl) {
        setMensajeFoto("No se pudo obtener la URL pública de la foto.");
        return;
      }

      const { error: updateError } = await supabase
        .from("perfiles")
        .update({ avatarurl: avatarUrl })
        .eq("id", userId);

      if (updateError) {
        setMensajeFoto(updateError.message);
        return;
      }

      setPerfil((prev) => ({ ...prev, avatar: avatarUrl }));
      setMensajeFoto("Foto actualizada correctamente.");
    } catch (error) {
      console.error("Error subiendo foto:", error);
      setMensajeFoto("Ocurrió un error subiendo la foto.");
    } finally {
      setSubiendoFoto(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-4xl">⚽</div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
        {errorCarga}
      </div>
    );
  }

  if (!perfil || !stats) {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <div className="text-6xl">🔐</div>
        <h1 className="text-2xl font-bold text-gray-800">Accede a tu perfil</h1>
        <p className="text-gray-500 text-center max-w-sm">
          Inicia sesión para ver tu carta de jugador, tus estadísticas y tus logros.
        </p>
        <Link
          href="/login"
          className="px-6 py-3 bg-cancha-verde text-white font-bold rounded-xl hover:bg-cancha-verdeoscuro transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const logrosDesbloqueados = LOGROS_DEF.filter((l) => l.condicion(stats));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi perfil</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Carta */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700">🃏 Mi carta</h2>
          <PlayerCard
            nombre={perfil.nombre}
            posicion={perfil.posicion}
            media={stats.media_general} // aquí usamos la media normalizada
            stats={{
              ritmo: stats.ritmo,
              tiro: stats.tiro,
              pase: stats.pase,
              regate: stats.regate,
              defensa: stats.defensa,
              fisico: stats.fisico,
            }}
            avatar={perfil.avatar}
            nacionalidad={perfil.nacionalidad}
            size="lg"
          />
        </div>

        {/* Panel derecho (foto, créditos, stats rápidas, logros) */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-cancha-verde/20 flex items-center justify-center text-cancha-verdeoscuro font-bold text-xl">
                {perfil.avatar ? (
                  <img
                    src={perfil.avatar}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  perfil.nombre.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="flex-1">
                <p className="font-bold text-gray-800">
                  {perfil.nombre || "Sin nombre"}
                </p>
                <p className="text-sm text-gray-500">
                  {perfil.telefono || "Sin teléfono"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs text-gray-500">Foto de perfil</p>

              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cancha-verde text-white text-xs font-semibold shadow-sm hover:bg-cancha-verdeoscuro transition-colors active:scale-[0.97] cursor-pointer">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12v8m0-8l-3 3m3-3l3 3M5 12l1.5-4.5A2 2 0 018.4 6h7.2a2 2 0 011.9 1.5L19 12"
                    />
                  </svg>
                  Cambiar foto de perfil
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={subirFoto}
                    className="hidden"
                    disabled={subiendoFoto}
                  />
                </label>

                {subiendoFoto && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cancha-gris text-[11px] text-gray-600">
                    Subiendo foto...
                  </span>
                )}
              </div>

              {mensajeFoto && (
                <p className="text-[11px] text-gray-500 mt-1">{mensajeFoto}</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between bg-cancha-gris rounded-xl p-3">
              <div>
                <p className="text-xs text-gray-500">Créditos disponibles</p>
                <p className="font-black text-cancha-verdeoscuro text-xl">
                  {perfil.creditos || 0} ⚡
                </p>
              </div>
              <Link
                href="/creditos"
                className="px-3 py-1.5 bg-cancha-verde text-white text-xs font-semibold rounded-lg hover:bg-cancha-verdeoscuro transition-colors"
              >
                Recargar
              </Link>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Nacionalidad</p>
                <p className="font-bold text-gray-800">
                  {perfil.nacionalidad || "No definida"}
                </p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Posición preferida</p>
                <p className="font-bold text-gray-800">
                  {perfil.posicion || "MED"}
                </p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Partidos jugados</p>
                <p className="font-bold text-gray-800">
                  {stats.partidos_jugados || 0}
                </p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Ratio victorias / derrotas</p>
                <p className="font-bold text-gray-800">
                  {stats.ratio_vd || "0.00"}
                </p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Goles</p>
                <p className="font-bold text-gray-800">
                  {stats.goles_total || 0}
                </p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Promedio goles / partido</p>
                <p className="font-bold text-gray-800">
                  {stats.promedio_goles || "0.00"}
                </p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-500">Récord</p>
                <p className="font-bold text-gray-800">
                  {stats.victorias || 0} victorias · {stats.derrotas || 0} derrotas
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            <h2 className="font-semibold text-gray-700 mb-3">🏆 Logros</h2>
            <div className="grid grid-cols-2 gap-2">
              {LOGROS_DEF.map((logro) => {
                const desbloqueado = logrosDesbloqueados.some(
                  (l) => l.id === logro.id
                );
                return (
                  <div
                    key={logro.id}
                    className={`rounded-xl p-3 flex flex-col gap-1 transition-all ${
                      desbloqueado
                        ? "bg-cancha-verde/10 border border-cancha-verde/30"
                        : "bg-gray-50 border border-gray-100 opacity-50"
                    }`}
                  >
                    <span className="text-xl">{logro.icon}</span>
                    <p className="text-xs font-semibold text-gray-700">
                      {logro.label}
                    </p>
                    <p className="text-xs text-cancha-verde font-medium">
                      {logro.bonus}
                    </p>
                    <p className="text-xs text-gray-400">{logro.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}