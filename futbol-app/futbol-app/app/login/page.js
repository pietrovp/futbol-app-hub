"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [modo, setModo] = useState("registro");
  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    clave: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar() {
    if (!supabase) {
      setMensaje("Falta conectar Supabase (revisa .env.local).");
      return;
    }
    setCargando(true);
    setMensaje("");

    if (modo === "registro") {
      const { data, error } = await supabase.auth.signUp({
        email: form.correo,
        password: form.clave,
        options: {
          data: {
            nombre: form.nombre,
            telefono: form.telefono,
          },
        },
      });

      if (error) {
        setMensaje(error.message);
      } else if (data.user) {
        setMensaje("Cuenta creada.");
        router.push("/");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: form.correo,
        password: form.clave,
      });

      if (error) {
        setMensaje(error.message);
      } else {
        setMensaje("Ingresaste correctamente.");
        router.push("/");
        router.refresh();
      }
    }

    setCargando(false);
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">
        {modo === "registro" ? "Crear cuenta" : "Ingresar"}
      </h1>

      {modo === "registro" && (
        <>
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => actualizar("nombre", e.target.value)}
          />
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => actualizar("telefono", e.target.value)}
          />
        </>
      )}

      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Correo"
        type="email"
        value={form.correo}
        onChange={(e) => actualizar("correo", e.target.value)}
      />
      <input
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        placeholder="Contraseña"
        type="password"
        value={form.clave}
        onChange={(e) => actualizar("clave", e.target.value)}
      />

      <button
        disabled={cargando}
        onClick={enviar}
        className="bg-cancha-verde text-white rounded-lg py-2 text-sm font-medium hover:bg-cancha-verdeoscuro"
      >
        {cargando
          ? "Un momento..."
          : modo === "registro"
          ? "Crear cuenta"
          : "Ingresar"}
      </button>

      <button
        onClick={() => setModo(modo === "registro" ? "ingreso" : "registro")}
        className="text-xs text-gray-500 underline"
      >
        {modo === "registro" ? "Ya tengo cuenta" : "Crear una cuenta nueva"}
      </button>

      {mensaje && <p className="text-xs text-gray-600">{mensaje}</p>}
    </div>
  );
}
