"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { formatCurrency, getMetodoLabel } from "../../lib/paymentHelpers";

export default function CreditosPage() {
  const [usuario, setUsuario] = useState(null);
  const [creditosActuales, setCreditosActuales] = useState(null);
  const [packages, setPackages] = useState([]);
  const [settings, setSettings] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [metodo, setMetodo] = useState("pago_movil");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState({
    reference: "",
    payer_phone: "",
    payer_document: "",
    payer_bank: "",
    payer_name: "",
    amount_bs: "",
  });

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

      const [pkgRes, setRes] = await Promise.all([
        supabase
          .from("credit_packages")
          .select("*")
          .eq("activo", true)
          .order("orden", { ascending: true }),
        supabase
          .from("merchant_payment_settings")
          .select("*")
          .eq("activo", true),
      ]);

      setPackages(pkgRes.data || []);
      setSettings(setRes.data || []);

      if (user) {
        const { data: perfil } = await supabase
          .from("perfiles")
          .select("creditos")
          .eq("id", user.id)
          .single();

        setCreditosActuales(perfil?.creditos ?? 0);
      }

      setLoading(false);
    }

    cargar();
  }, []);

  const paquete = useMemo(
    () => packages.find((p) => p.code === seleccionado) || null,
    [packages, seleccionado]
  );

  const metodoConfig = useMemo(
    () => settings.find((s) => s.metodo === metodo) || null,
    [settings, metodo]
  );

  async function subirComprobante(file, userId) {
    const ext = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("payment-proofs")
      .upload(filePath, file, { upsert: false });

    if (error) throw error;

    const { data } = supabase.storage
      .from("payment-proofs")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function reportarPago(e) {
    e.preventDefault();
    setMensaje("");

    if (!usuario) {
      setMensaje("Debes iniciar sesión para reportar el pago.");
      return;
    }

    if (!paquete) {
      setMensaje("Selecciona un paquete.");
      return;
    }

    setSubmitting(true);

    try {
      let proofUrl = null;
      const file = e.target.proof.files?.[0];

      if (file) {
        proofUrl = await subirComprobante(file, usuario.id);
      }

      const { error } = await supabase.from("payments").insert({
        user_id: usuario.id,
        package_id: paquete.id,
        method: metodo,
        status: "submitted",
        amount_usd: paquete.precio_usd,
        amount_bs: form.amount_bs ? Number(form.amount_bs) : null,
        reference: form.reference,
        payer_phone: form.payer_phone || null,
        payer_document: form.payer_document || null,
        payer_bank: form.payer_bank || null,
        payer_name: form.payer_name || null,
        proof_url: proofUrl,
      });

      if (error) throw error;

      setMensaje("Pago reportado correctamente. Quedó pendiente por aprobación.");
      setForm({
        reference: "",
        payer_phone: "",
        payer_document: "",
        payer_bank: "",
        payer_name: "",
        amount_bs: "",
      });
      e.target.reset();
    } catch (error) {
      setMensaje(error.message || "No se pudo reportar el pago.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando paquetes...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Paquetes de créditos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Compra créditos y úsalos para unirte a partidos.
          </p>
        </div>

        {creditosActuales !== null && (
          <div className="bg-cancha-verde/10 border border-cancha-verde/20 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-500">Mis créditos</p>
            <p className="text-2xl font-black text-cancha-verdeoscuro">
              {creditosActuales} ⚡
            </p>
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            type="button"
            onClick={() => setSeleccionado(pkg.code)}
            className={`text-left rounded-2xl bg-white p-5 shadow-card border transition ${
              seleccionado === pkg.code
                ? "border-cancha-verde ring-2 ring-cancha-verde/30"
                : "border-gray-100 hover:border-cancha-verde/30"
            }`}
          >
            <p className="text-xs text-gray-500">{pkg.code.toUpperCase()}</p>
            <h3 className="font-bold text-lg text-gray-800 mt-1">{pkg.nombre}</h3>
            <p className="text-cancha-verde font-black text-2xl mt-3">{pkg.creditos} ⚡</p>
            <p className="text-sm text-gray-500 mt-1">
              {formatCurrency(pkg.precio_usd, "USD")}
            </p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-3">Método de pago</h2>

        <div className="flex gap-3 flex-wrap">
          {["pago_movil", "zelle"].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetodo(m)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                metodo === m
                  ? "bg-cancha-verde text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {getMetodoLabel(m)}
            </button>
          ))}
        </div>

        {metodoConfig && (
          <div className="mt-5 rounded-2xl bg-cancha-gris p-4">
            <h3 className="font-semibold text-gray-800 mb-2">
              Instrucciones de {getMetodoLabel(metodo)}
            </h3>

            {metodo === "pago_movil" ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p>Banco: {metodoConfig.banco}</p>
                <p>Teléfono: {metodoConfig.telefono}</p>
                <p>Documento: {metodoConfig.documento}</p>
                <p>Titular: {metodoConfig.titular}</p>
                {metodoConfig.instrucciones && <p>{metodoConfig.instrucciones}</p>}
              </div>
            ) : (
              <div className="text-sm text-gray-700 space-y-1">
                <p>Correo Zelle: {metodoConfig.correo_zelle}</p>
                <p>Beneficiario: {metodoConfig.nombre_zelle}</p>
                {metodoConfig.instrucciones && <p>{metodoConfig.instrucciones}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <form
        onSubmit={reportarPago}
        className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex flex-col gap-4"
      >
        <div>
          <h2 className="font-semibold text-gray-800">Ya pagué</h2>
          <p className="text-sm text-gray-500 mt-1">
            Reporta tu pago para que el admin lo apruebe y se acrediten tus créditos.
          </p>
        </div>

        {!usuario && (
          <div className="rounded-xl bg-yellow-50 text-yellow-800 px-4 py-3 text-sm">
            Debes iniciar sesión antes de reportar un pago.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <input
            placeholder="Referencia"
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
            required
          />
          <input
            placeholder="Nombre de quien pagó"
            value={form.payer_name}
            onChange={(e) => setForm({ ...form, payer_name: e.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
            required
          />
          <input
            placeholder="Teléfono del emisor"
            value={form.payer_phone}
            onChange={(e) => setForm({ ...form, payer_phone: e.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          <input
            placeholder="Documento del emisor"
            value={form.payer_document}
            onChange={(e) => setForm({ ...form, payer_document: e.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          <input
            placeholder="Banco emisor"
            value={form.payer_bank}
            onChange={(e) => setForm({ ...form, payer_bank: e.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
          <input
            placeholder="Monto en Bs. (opcional)"
            type="number"
            step="0.01"
            value={form.amount_bs}
            onChange={(e) => setForm({ ...form, amount_bs: e.target.value })}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comprobante
          </label>
          <input
            type="file"
            name="proof"
            accept="image/*,.pdf"
            className="block w-full text-sm"
          />
        </div>

        {paquete && (
          <div className="rounded-xl bg-green-50 text-green-800 px-4 py-3 text-sm">
            Vas a reportar el paquete <strong>{paquete.nombre}</strong> por{" "}
            {formatCurrency(paquete.precio_usd, "USD")}.
          </div>
        )}

        <button
          type="submit"
          disabled={!usuario || !paquete || submitting}
          className={`rounded-xl py-3 text-sm font-bold transition ${
            !usuario || !paquete || submitting
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-cancha-verde text-white hover:bg-cancha-verdeoscuro"
          }`}
        >
          {submitting ? "Enviando..." : "Reportar pago"}
        </button>

        {mensaje && <p className="text-sm text-gray-500">{mensaje}</p>}
      </form>
    </div>
  );
}
