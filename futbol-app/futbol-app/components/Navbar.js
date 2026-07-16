"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const [usuario, setUsuario] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    async function cargarPerfil(userId) {
      const { data } = await supabase
        .from("perfiles")
        .select("es_admin")
        .eq("id", userId)
        .single();
      setEsAdmin(data?.es_admin || false);
    }

    async function cargarSesion() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUsuario(user);
      if (user) cargarPerfil(user.id);
    }
    cargarSesion();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUsuario(session?.user || null);
        if (session?.user) {
          cargarPerfil(session.user.id);
        } else {
          setEsAdmin(false);
        }
      }
    );

    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function salir() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-cancha-verdeoscuro text-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-semibold text-lg">
        ⚽ Partidos BQTO
      </Link>
      <div className="flex gap-4 text-sm items-center">
        <Link href="/">Partidos</Link>
        <Link href="/perfil">Mi perfil</Link>
        {esAdmin && <Link href="/admin">Crear partido</Link>}
        {usuario ? (
          <button onClick={salir} className="underline">
            Salir
          </button>
        ) : (
          <Link href="/login">Ingresar</Link>
        )}
      </div>
    </nav>
  );
}
