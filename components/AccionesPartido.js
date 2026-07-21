"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function AccionesPartido({ partidoId, cuposLibres, estado, inscritos }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [inscripcionId, setInscripcionId] = useState(null);
  const [esOrganizador, setEsOrganizador] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const partidoCerradoParaCambios =
    estado === "equipos_listos" || estado === "en_curso" || estado === "finalizado";

  useEffect(() => {
    async function cargar() {
      if (!supabase) {
        setCargando(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUsuario(user || null);

      if (user) {
        const [{ data: insc }, { data: perfil }] = await Promise.all([
          supabase
            .from("inscripciones")
            .select("id")
            .eq("partido_id", partidoId)
            .eq("usuario_id", user.id)
            .maybeSingle(),
          supabase
            .from("perfiles")
            .select("es_organizador")
            .eq("id", user.id)
            .single(),
        ]);

        setInscripcionId(insc?.id || null);
        setEsOrganizador(!!perfil?.es_organizador);
      }

      setCargando(false);
    }

    cargar();
  }, [partidoId]);

  async function unirse() {
    if (!usuario) {
      setMensaje("Inicia sesión para unirte.");
      return;
    }

    if (partidoCerradoParaCambios) {
      setMensaje("Este partido ya no acepta nuevas inscripciones.");
      return;
    }

    setProcesando(true);
    setMensaje("");

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("creditos")
      .eq("id", usuario.id)
      .single();

    const creditos = perfil?.creditos ?? 0;

    if (creditos < 1) {
      setMensaje("No tienes créditos suficientes.");
      setProcesando(false);
      return;
    }

    const nuevoBalance = creditos - 1;

    const { error: updateError } = await supabase
      .from("perfiles")
      .update({ creditos: nuevoBalance })
      .eq("id", usuario.id);

    if (updateError) {
      setMensaje("No se pudo descontar el crédito.");
      setProcesando(false);
      return;
    }

    const { data: nuevaInscripcion, error: inscripcionError } = await supabase
      .from("inscripciones")
      .insert({ partido_id: partidoId, usuario_id: usuario.id })
      .select("id")
      .single();

    if (inscripcionError) {
      await supabase.from("perfiles").update({ creditos }).eq("id", usuario.id);
      setMensaje("No se pudo unir al partido.");
      setProcesando(false);
      return;
    }

    setInscripcionId(nuevaInscripcion.id);
    setMensaje("¡Te uniste al partido!");
    setProcesando(false);
    router.refresh();
  }

  async function cancelar() {
    if (partidoCerradoParaCambios) {
      setMensaje("Ya no puedes cancelar tu inscripción porque el partido ya está armado o finalizado.");
      return;
    }

    setProcesando(true);
    setMensaje("");

    const { error: deleteError } = await supabase
      .from("inscripciones")
      .delete()
      .eq("id", inscripcionId);

    if (deleteError) {
      setMensaje("No se pudo cancelar la inscripción.");
      setProcesando(false);
      return;
    }

    const { data: perfil } = await supabase
      .from("perfiles")
      .select("creditos")
      .eq("id", usuario.id)
      .single();

    const nuevoBalance = (perfil?.creditos ?? 0) + 1;

    await supabase.from("perfiles").update({ creditos: nuevoBalance }).eq("id", usuario.id);

    setInscripcionId(null);
    setMensaje("Cancelaste tu inscripción y se devolvió tu crédito.");
    setProcesando(false);
    router.refresh();
  }

  async function sortearYEntrar() {
    if (!inscritos || inscritos.length < 2) {
      setMensaje("Necesitas al menos 2 jugadores inscritos para sortear.");
      return;
    }

    setProcesando(true);
    setMensaje("");

    const ordenados = [...inscritos].sort((a, b) => (b.media || 0) - (a.media || 0));

    const updates = ordenados.map((jugador, idx) => {
      const vuelta = Math.floor(idx / 2) % 2;
      const equipo = vuelta === 0 ? (idx % 2 === 0 ? 1 : 2) : (idx % 2 === 0 ? 2 : 1);
      return supabase.from("inscripciones").update({ equipo }).eq("id", jugador.id);
    });

    const resultados = await Promise.all(updates);
    const conError = resultados.find((r) => r.error);

    if (conError) {
      setMensaje("No se pudo sortear: " + conError.error.message);
      setProcesando(false);
      return;
    }

    const { error: estadoError } = await supabase
      .from("partidos")
      .update({ estado: "equipos_listos" })
      .eq("id", partidoId);

    if (estadoError) {
      setMensaje("No se pudo actualizar el estado: " + estadoError.message);
      setProcesando(false);
      return;
    }

    router.push(`/partido/${partidoId}/organizar`);
  }

  if (cargando) return null;

  if (!usuario) {
    return (
      <div className="rounded-xl bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">
        Inicia sesión para unirte a este partido.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {estado === "finalizado" ? (
          <div className="rounded-xl bg-gray-100 text-gray-700 px-4 py-3 text-sm font-medium">
            🏁 Este partido ya finalizó. Solo puedes ver el resultado y los equipos.
          </div>
        ) : inscripcionId ? (
          <>
            <div className="rounded-xl bg-green-50 text-green-700 px-4 py-3 text-sm font-medium">
              ✅ Ya estás inscrito en este partido
            </div>

            {partidoCerradoParaCambios ? (
              <div className="rounded-xl bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">
                Las inscripciones ya están cerradas para este partido.
              </div>
            ) : (
              <button
                onClick={cancelar}
                disabled={procesando}
                className="rounded-xl py-3 text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
              >
                {procesando ? "Procesando..." : "Cancelar inscripción"}
              </button>
            )}
          </>
        ) : (
          <button
            onClick={unirse}
            disabled={procesando || cuposLibres <= 0 || partidoCerradoParaCambios}
            className={`rounded-xl py-3 text-sm font-bold transition ${
              cuposLibres <= 0 || partidoCerradoParaCambios
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-cancha-verde text-white hover:bg-cancha-verdeoscuro"
            }`}
          >
            {partidoCerradoParaCambios
              ? "Inscripciones cerradas"
              : cuposLibres <= 0
              ? "Sin cupo"
              : procesando
              ? "Procesando..."
              : "⚡ Unirme al partido"}
          </button>
        )}
      </div>

      {esOrganizador && (
        <div className="rounded-2xl border-2 border-cancha-verde/30 bg-cancha-verde/5 p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-cancha-verdeoscuro uppercase">
            Panel del organizador
          </p>

          {estado === "abierto" && (
            <button
              onClick={sortearYEntrar}
              disabled={procesando}
              className="rounded-xl py-3 text-sm font-bold bg-cancha-verdeoscuro text-white hover:opacity-90 transition disabled:opacity-50"
            >
              {procesando ? "Sorteando..." : "🎲 Sortear equipos"}
            </button>
          )}

          {(estado === "equipos_listos" || estado === "en_curso" || estado === "finalizado") && (
            <button
              onClick={() => router.push(`/partido/${partidoId}/organizar`)}
              className="rounded-xl py-3 text-sm font-bold bg-cancha-verdeoscuro text-white hover:opacity-90 transition"
            >
              🏟️ Ir al panel del partido
            </button>
          )}
        </div>
      )}

      {mensaje && <p className="text-sm text-gray-500">{mensaje}</p>}
    </div>
  );
}