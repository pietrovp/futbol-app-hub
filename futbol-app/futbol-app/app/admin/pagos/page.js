"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import {
  formatCurrency,
  getMetodoLabel,
  getStatusLabel,
} from "../../../lib/paymentHelpers";

export default function AdminPagosPage() {
  const [pagos, setPagos] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargar() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUsuario(user || null);

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("es_admin")
        .eq("id", user.id)
        .single();

      const admin = !!perfil?.es_admin;
      setEsAdmin(admin);

      if (!admin) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("payments")
        .select(`
          *,
          perfiles!payments_user_id_fkey(nombre),
          credit_packages(nombre, creditos)
        `)
        .order("created_at", { ascending: false });

      setPagos(data || []);
      setLoading(false);
    }

    cargar();
  }, []);

  async function actualizarEstado(paymentId, newStatus) {
    const { error } = await supabase
      .from("payments")
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: usuario.id,
      })
      .eq("id", paymentId);

    if (error) {
      alert(error.message);
      return;
    }

    if (newStatus === "confirmed") {
      const pago = pagos.find((p) => p.id === paymentId);
      if (pago) {
        const delta = pago.credit_packages?.creditos || 0;

        const { data: perfil } = await supabase
          .from("perfiles")
          .select("creditos")
          .eq("id", pago.user_id)
          .single();

        const current = perfil?.creditos ?? 0;
        const nextBalance = current + delta;

        await supabase
          .from("perfiles")
          .update({ creditos: nextBalance })
          .eq("id", pago.user_id);

        await supabase.from("credit_ledger").insert({
          user_id: pago.user_id,
          payment_id: pago.id,
          delta,
          reason: "payment_confirmed",
          balance_after: nextBalance,
        });
      }
    }

    setPagos((prev) =>
      prev.map((p) => (p.id === paymentId ? { ...p, status: newStatus } : p))
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando pagos...</p>;
  }

  if (!usuario) {
    return <p className="text-sm text-gray-500">Inicia sesión para continuar.</p>;
  }

  if (!esAdmin) {
    return <p className="text-sm text-gray-500">No tienes acceso a esta página.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pagos reportados</h1>
        <p className="text-sm text-gray-500 mt-1">
          Aprueba o rechaza pagos de Pago Móvil y Zelle.
        </p>
      </div>

      <div className="grid gap-4">
        {pagos.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 text-sm text-gray-500">
            No hay pagos reportados todavía.
          </div>
        )}

        {pagos.map((pago) => (
          <div
            key={pago.id}
            className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex flex-col gap-3"
          >
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-800">
                  {pago.perfiles?.nombre || "Jugador"}
                </p>
                <p className="text-sm text-gray-500">
                  {pago.credit_packages?.nombre || "Paquete"} ·{" "}
                  {pago.credit_packages?.creditos || 0} créditos
                </p>
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                {getStatusLabel(pago.status)}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
              <p>Método: {getMetodoLabel(pago.method)}</p>
              <p>Monto USD: {formatCurrency(pago.amount_usd, "USD")}</p>
              <p>Monto Bs: {pago.amount_bs || "-"}</p>
              <p>Referencia: {pago.reference || "-"}</p>
              <p>Banco emisor: {pago.payer_bank || "-"}</p>
              <p>Teléfono emisor: {pago.payer_phone || "-"}</p>
              <p>Documento emisor: {pago.payer_document || "-"}</p>
              <p>Nombre emisor: {pago.payer_name || "-"}</p>
            </div>

            {pago.proof_url && (
              <a
                href={pago.proof_url}
                target="_blank"
                className="text-sm text-cancha-verde underline"
              >
                Ver comprobante
              </a>
            )}

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => actualizarEstado(pago.id, "confirmed")}
                className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold"
              >
                Aprobar
              </button>
              <button
                onClick={() => actualizarEstado(pago.id, "rejected")}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold"
              >
                Rechazar
              </button>
              <button
                onClick={() => actualizarEstado(pago.id, "under_review")}
                className="px-4 py-2 rounded-xl bg-gray-800 text-white text-sm font-semibold"
              >
                Marcar revisión
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
