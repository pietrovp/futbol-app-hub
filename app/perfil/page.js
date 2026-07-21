"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import PlayerCard from "../../components/PlayerCard";
import LogroBadge from "../../components/LogroBadge";
import { bonusLabel } from "../../lib/logros";
import Link from "next/link";

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [logros, setLogros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
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

        const [{ data: p, error: perfilError }, { data: logrosCatalogo }, { data: logrosUsuario }] =
          await Promise.all([
            supabase.from("perfiles").select("*").eq("id", user.id).single(),
            supabase.from("logros").select("*").eq("activo", true).order("created_at", { ascending: true }),
            supabase.from("logros_desbloqueados").select("logro_id").eq("usuario_id", user.id),
          ]);

        if (perfilError) {
          console.error("Error perfil:", perfilError);
          setErrorCarga(perfilError.message || "No se pudo cargar el perfil.");
          return;
        }

        const partidos_jugados = p.partidos_jugados ?? 0;
        const goles_total = p.goles_total ?? 0;
        const victorias = p.victorias ?? 0;
        const derrotas = p.derrotas ?? 0;

        const promedio_goles =
          partidos_jugados > 0 ? (goles_total / partidos_jugados).toFixed(2) : "0.00";

        const ratio_vd =
          derrotas > 0 ? (victorias / derrotas).toFixed(2) : victorias > 0 ? "∞" : "0.00";

        setPerfil(p);
        setStats({
          partidos_jugados,
          goles_total,
          media_general: p.media_general || 64,
          ritmo: p.ritmo || 64,
          tiro: p.tiro || 64,
          pase: p.pase || 64,
          regate: p.regate || 64,
          defensa: p.defensa || 64,
          fisico: p.fisico || 64,
          victorias,
          derrotas,
          promedio_goles,
          ratio_vd,
        });

        const idsDesbloqueados = new Set((logrosUsuario || []).map((d) => d.logro_id));
        setLogros(
          (logrosCatalogo || []).map((l) => ({
            ...l,
            desbloqueado: idsDesbloqueados.has(l.id),
          }))
        );
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

      const avatar_url = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("perfiles")
        .update({ avatar_url })
        .eq("id", userId);

      if (updateError) {
        setMensajeFoto(updateError.message);
        return;
      }

      setPerfil((prev) => ({ ...prev, avatar_url }));
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

  if (!perfil) {
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

  const logrosDesbloqueados = logros.filter((l) => l.desbloqueado).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi perfil</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700">🃏 Mi carta</h2>
          <PlayerCard
            nombre={perfil.nombre || "Jugador"}
            posicion={perfil.posicion_preferida || perfil.posicion || "MED"}
            media={perfil.media_general || 64}
            stats={{
              ritmo: stats?.ritmo || 64,
              tiro: stats?.tiro || 64,
              pase: stats?.pase || 64,
              regate: stats?.regate || 64,
              defensa: stats?.defensa || 64,
              fisico: stats?.fisico || 64,
            }}
            avatar={perfil.avatar_url || null}
            nacionalidad={perfil.nacionalidad || null}
            size="lg"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-cancha-verde/20 flex items-center justify-center text-cancha-verdeoscuro font-bold text-xl">
                {perfil.avatar_url ? (
                  <img
                    src={perfil.avatar_url}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  perfil.nombre ? perfil.nombre.slice(0, 2).toUpperCase() : "?"
                )}
              </div>

              <div className="flex-1">
                <p className="font-bold text-gray-800">{perfil.nombre || "Sin nombre"}</p>
                <p className="text-sm text-gray-500">{perfil.telefono || "Sin teléfono"}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Subir foto de perfil
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={subirFoto}
                className="text-sm text-gray-600"
                disabled={subiendoFoto}
              />
              {subiendoFoto && <p className="text-xs text-gray-500">Subiendo foto...</p>}
              {mensajeFoto && <p className="text-xs text-gray-500">{mensajeFoto}</p>}
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
                <p className="font-bold text-gray-800">{perfil.nacionalidad || "No definida"}</p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Posición preferida</p>
                <p className="font-bold text-gray-800">
                  {perfil.posicion_preferida || perfil.posicion || "MED"}
                </p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Partidos jugados</p>
                <p className="font-bold text-gray-800">{stats?.partidos_jugados || 0}</p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Ratio victorias / derrotas</p>
                <p className="font-bold text-gray-800">{stats?.ratio_vd || "0.00"}</p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Goles</p>
                <p className="font-bold text-gray-800">{stats?.goles_total || 0}</p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3">
                <p className="text-xs text-gray-500">Promedio goles / partido</p>
                <p className="font-bold text-gray-800">{stats?.promedio_goles || "0.00"}</p>
              </div>

              <div className="bg-cancha-gris rounded-xl p-3 col-span-2">
                <p className="text-xs text-gray-500">Récord</p>
                <p className="font-bold text-gray-800">
                  {stats?.victorias || 0} victorias · {stats?.derrotas || 0} derrotas
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-700">🏆 Logros</h2>
              <span className="text-xs font-bold text-cancha-verdeoscuro bg-cancha-gris rounded-full px-2.5 py-1">
                {logrosDesbloqueados}/{logros.length}
              </span>
            </div>

            {logros.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no hay logros disponibles.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {logros.map((l) => (
                  <LogroBadge
                    key={l.id}
                    label={l.nombre}
                    desc={l.descripcion}
                    bonus={bonusLabel(l)}
                    desbloqueado={l.desbloqueado}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}