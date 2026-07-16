"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Admin() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [autorizado, setAutorizado] = useState(false);
  const [form, setForm] = useState({
    cancha: "",
    zona: "",
    fecha: "",
    hora: "",
    cupos: "",
    precio: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    async function verificar() {
      if (!supabase) {
        setVerificando(false);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setVerificando(false);
        return;
      }

      const { data } = await supabase
        .from("perfiles")
        .select("es_admin")
        .eq("id", user.id)
        .single();

      setAutorizado(data?.es_admin || false);
      setVerificando(false);
    }
    verificar();
  }, []);

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function publicar() {
    setCargando(true);
    setMensaje("");

    const { error } = await supabase.from("partidos").insert({
      cancha: form.cancha,
      zona: form.zona,
      fecha: form.fecha,
      hora: form.hora,
      cupos_totales: Number(form.cupos),
      precio: Number(form.precio),
    });

    setCargando(false);

    if (error) {
      setMensaje("No se pudo publicar: " + error.message);
    } else {
      setMensaje("¡Partido publicado!");
      router.push("/");
      router.refresh();
    }
  }

  if (verificando) {
    return <p className="text-sm text-gray-500">Verificando permisos...</p>;
  }

  if (!autorizado) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Crear partido</h1>
        <p className="text-sm text-gray-500">
          Esta sección es solo para administradores. Inicia sesión con una
          cuenta de administrador para publicar partidos.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Crear partido</h1>

      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Nombre de la cancha"
        value={form.cancha}
        onChange={(e) => actualizar("cancha", e.target.value)}
      />
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Zona (ej. Barquisimeto Este)"
        value={form.zona}
        onChange={(e) => actualizar("zona", e.target.value)}
      />
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        type="date"
        value={form.fecha}
        onChange={(e) => actualizar("fecha", e.target.value)}
      />
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        type="time"
        value={form.hora}
        onChange={(e) => actualizar("hora", e.target.value)}
      />
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        type="number"
        placeholder="Cupos totales"
        value={form.cupos}
        onChange={(e) => actualizar("cupos", e.target.value)}
      />
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        type="number"
        placeholder="Precio por cupo ($)"
        value={form.precio}
        onChange={(e) => actualizar("precio", e.target.value)}
      />

      <button
        disabled={cargando}
        onClick={publicar}
        className="bg-cancha-verde text-white rounded-lg py-2 text-sm font-medium hover:bg-cancha-verdeoscuro"
      >
        {cargando ? "Publicando..." : "Publicar partido"}
      </button>

      {mensaje && <p className="text-xs text-gray-600">{mensaje}</p>}
    </div>
  );
}
