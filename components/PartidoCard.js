"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatFecha(fechaStr) {
  if (!fechaStr) return "";
  const d = new Date(fechaStr + "T00:00:00");
  return `${DIAS[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

function formatHora(horaStr) {
  if (!horaStr) return "";
  const [horas, minutos] = horaStr.split(":");
  const h = parseInt(horas, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${minutos} ${ampm}`;
}

export default function PartidoCard({ partido }) {
  const router = useRouter();

  const [verificando, setVerificando] = useState(true);
  const [inscrito, setInscrito] = useState(false);
  const [inscripcionId, setInscripcionId] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [confirmandoCancelacion, setConfirmandoCancelacion] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cuposLibres = partido.cuposTotales - partido.cuposOcupados;
  const lleno = cuposLibres <= 0;
  const ocupacion = Math.round((partido.cuposOcupados / partido.cuposTotales) * 100);

  useEffect(() => {
    let mounted = true;

    async function verificarInscripcion() {
      if (!supabase) {
        setVerificando(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setInscrito(false);
        setVerificando(false);
        return;
      }

      const { data } = await supabase
        .from("inscripciones")
        .select("id")
        .eq("partido_id", partido.id)
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (!mounted) return;

      setInscrito(!!data);
      setInscripcionId(data?.id ?? null);
      setVerificando(false);
    }

    verificarInscripcion();

    return () => {
      mounted = false;
    };
  }, [partido.id]);

  async function unirse() {
    if (!supabase) return;

    setCargando(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMensaje("Primero inicia sesión para unirte.");
      setCargando(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("creditos")
      .eq("id", user.id)
      .single();

    const creditos = perfil?.creditos ?? 0;

    if (creditos < 1) {
      setMensaje("No tienes créditos suficientes. Recarga antes de unirte.");
      setCargando(false);
      return;
    }

    const { data: yaInscrito } = await supabase
      .from("inscripciones")
      .select("id")
      .eq("partido_id", partido.id)
      .eq("usuario_id", user.id)
      .maybeSingle();

    if (yaInscrito) {
      setInscrito(true);
      setInscripcionId(yaInscrito.id);
      setMensaje("Ya estás inscrito en este partido.");
      setCargando(false);
      return;
    }

    const nuevoBalance = creditos - 1;

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ creditos: nuevoBalance })
      .eq("id", user.id);

    if (updateError) {
      setMensaje("No se pudo descontar el crédito.");
      setCargando(false);
      return;
    }

    const { data: nuevaInscripcion, error: inscripcionError } = await supabase
      .from("inscripciones")
      .insert({ partido_id: partido.id, usuario_id: user.id })
      .select("id")
      .single();

    if (inscripcionError) {
      await supabase.from("perfiles").update({ creditos }).eq("id", user.id);
      setMensaje("No se pudo unir al partido.");
      setCargando(false);
      return;
    }

    await supabase.from("credit_ledger").insert({
      user_id: user.id,
      partido_id: partido.id,
      delta: -1,
      reason: "match_join",
      balance_after: nuevoBalance,
    });

    setInscrito(true);
    setInscripcionId(nuevaInscripcion?.id ?? null);
    setMensaje("¡Te uniste al partido! Se descontó 1 crédito.");
    setCargando(false);
    router.refresh();
  }

  async function cancelarInscripcion() {
    if (!supabase || !inscripcionId) return;

    setCancelando(true);
    setMensaje("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCancelando(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("inscripciones")
      .delete()
      .eq("id", inscripcionId);

    if (deleteError) {
      setMensaje("No se pudo cancelar la inscripción.");
      setCancelando(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("creditos")
      .eq("id", user.id)
      .single();

    const creditos = perfil?.creditos ?? 0;
    const nuevoBalance = creditos + 1;

    await supabase.from("perfiles").update({ creditos: nuevoBalance }).eq("id", user.id);

    await supabase.from("credit_ledger").insert({
      user_id: user.id,
      partido_id: partido.id,
      delta: 1,
      reason: "match_cancel",
      balance_after: nuevoBalance,
    });

    setInscrito(false);
    setInscripcionId(null);
    setConfirmandoCancelacion(false);
    setCancelando(false);
    setMensaje("Cancelaste tu inscripción. Se reembolsó 1 crédito.");
    router.refresh();
  }

  return (
    <div className="group bg-[#121212] rounded-2xl border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-colors flex flex-col">

      {/* HEADER CON IMAGEN DE FONDO Y DEGRADADO */}
      <div className="relative h-40 w-full overflow-hidden">
        {partido.imagenUrl ? (
          <img
            src={partido.imagenUrl}
            alt={partido.cancha}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />

        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center bg-amber-100 border border-amber-300 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            {partido.creditos ?? 1} {(partido.creditos ?? 1) === 1 ? "crédito" : "créditos"}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="font-black text-white text-2xl leading-tight tracking-tight drop-shadow-lg">
            {partido.cancha}
          </h3>
          <p className="text-zinc-300 text-xs mt-1 font-semibold drop-shadow-md">{partido.zona}</p>
        </div>
      </div>

      {/* CUERPO DE LA TARJETA */}
      <div className="px-5 py-5 flex flex-col gap-5 flex-grow">

        <div className="flex items-center gap-6 text-sm text-zinc-400 font-medium">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {formatFecha(partido.fecha)}
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {formatHora(partido.hora)}
          </span>
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-500 mb-2 font-medium">
            <span className={lleno ? "text-red-400 font-bold" : ""}>
              {lleno ? "Cupos agotados" : `${cuposLibres} cupos disponibles`}
            </span>
            <span className="text-zinc-300 font-bold">{partido.cuposOcupados} <span className="text-zinc-600 font-normal">/ {partido.cuposTotales}</span></span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                lleno ? "bg-red-500" : ocupacion > 75 ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ width: `${Math.min(ocupacion, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex gap-3">
            {inscrito ? (
              <div className="flex-1 rounded-xl py-3 text-sm font-bold flex justify-center items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
                Inscrito
              </div>
            ) : (
              <button
                disabled={lleno || cargando || verificando}
                onClick={unirse}
                className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all flex justify-center items-center gap-2 ${
                  lleno || cargando || verificando
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-green-500 text-black hover:bg-green-400 active:scale-[0.98]"
                }`}
              >
                {lleno ? "Sin cupo" : cargando ? "Procesando..." : verificando ? "Cargando..." : "Unirme ahora"}
              </button>
            )}
            <Link
              href={`/partido/${partido.id}`}
              className="px-5 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm font-bold hover:bg-zinc-800 hover:border-zinc-600 transition-all flex items-center justify-center"
            >
              Ver
            </Link>
          </div>

          {inscrito && (
            <div className="flex justify-center">
              {confirmandoCancelacion ? (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-zinc-500">¿Cancelar tu inscripción?</span>
                  <button
                    onClick={cancelarInscripcion}
                    disabled={cancelando}
                    className="font-bold text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {cancelando ? "Cancelando..." : "Sí, cancelar"}
                  </button>
                  <button
                    onClick={() => setConfirmandoCancelacion(false)}
                    disabled={cancelando}
                    className="font-bold text-zinc-400 hover:text-zinc-300"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmandoCancelacion(true)}
                  className="text-xs text-zinc-500 hover:text-red-400 font-medium underline underline-offset-2 transition-colors"
                >
                  Cancelar inscripción
                </button>
              )}
            </div>
          )}
        </div>

        {mensaje && (
          <div
            className={`text-xs text-center rounded-xl py-2.5 px-3 font-medium border ${
              mensaje.includes("uniste") || mensaje.includes("Cancelaste")
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            }`}
          >
            {mensaje}
          </div>
        )}
      </div>
    </div>
  );
}