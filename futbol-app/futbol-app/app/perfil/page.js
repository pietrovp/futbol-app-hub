"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import PlayerCard from "../../components/PlayerCard";
import Link from "next/link";

const LOGROS_DEF = [
  {
    id: "primer_partido",
    icon: "⚽",
    label: "Primer partido",
    desc: "Juega tu primer partido",
    bonus: 1, // +1 media
    condicion: (s) => s.partidos_jugados >= 1,
  },
  {
    id: "veterano",
    icon: "🏆",
    label: "Veterano",
    desc: "Juega 10 partidos",
    bonus: 5, // +5 media
    condicion: (s) => s.partidos_jugados >= 10,
  },
  {
    id: "goleador",
    icon: "👑",
    label: "Goleador",
    desc: "Anota 10 goles en total",
    bonus: 0, // este lo estás usando como +3 TIR, no media
    condicion: (s) => s.goles_total >= 10,
  },
];

export default function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState("");
  const [errorCarga, setErrorCarga] = useState("");
  const [userId, setUserId] = useState(null);

  const fileInputRef = useRef(null);

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

        const partidos_jugados =
          p.partidos_jugados ?? p.partidosjugados ?? 0;
        const goles_total =
          p.goles_total ?? p.golestotal ?? 0;
        const victorias = p.victorias ?? 0;
        const derrotas = p.derrotas ?? 0;

        const promedio_goles =
          partidos_jugados > 0 ? (goles_total / partidos_jugados).toFixed(2) : "0.00";

        const porcentaje_victorias =
          partidos_jugados > 0
            ? ((victorias / partidos_jugados) * 100).toFixed(0) + "%"
            : "0%";

        setPerfil(p);
        setStats({
          partidos_jugados,
          goles_total,
          media_base: p.mediageneral || 64,
          ritmo: p.ritmo || 64,
          tiro: p.tiro || 64,
          pase: p.pase || 64,
          regate: p.regate || 64,
          defensa: p.defensa || 64,
          fisico: p.fisico || 64,
          victorias,
          derrotas,
          promedio_goles,
          porcentaje_victorias,
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

      const avatarUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from("perfiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", userId);

      if (updateError) {
        setMensajeFoto(updateError.message);
        return;
      }

      setPerfil((prev) => ({ ...prev, avatar_url: avatarUrl }));
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

  // Logros desbloqueados con stats ya calculadas
  const logrosDesbloqueados = LOGROS_DEF.filter((l) => l.condicion(stats));

  // Bonus total de media basado en logros que afectan media
  const bonusMedia = logrosDesbloqueados
    .filter((l) => l.bonus) // solo los que suman media
    .reduce((acc, l) => acc + l.bonus, 0);

  const mediaBase = stats.media_base ?? 64;
  const mediaFinal = mediaBase + bonusMedia;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi perfil</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-gray-700">🃏 Mi carta</h2>
          <PlayerCard
            nombre={perfil.nombre || "Jugador"}
            posicion={perfil.posicionpreferida || perfil.posicion || "MED"}
            media={mediaFinal}
            stats={{
              ritmo: stats.ritmo,
              tiro: stats.tiro,
              pase: stats.pase,
              regate: stats.regate,
              defensa: stats.defensa,
              fisico: stats.fisico,
            }}
            avatar={perfil.avatar_url || null}
            nacionalidad={perfil.nacionalidad || null}
            size="lg"
          />
        </div>

        {/* resto del componente igual, usando stats y logrosDesbloqueados */}
        {/* ... */}
      </div>
    </div>
  );
}
      </div>
    </div>
  );
}
