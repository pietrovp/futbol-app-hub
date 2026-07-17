"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      const { data: { user } } = await supabase.auth.getUser();
      setUsuario(user);
      if (user) cargarPerfil(user.id);
    }
    cargarSesion();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user || null);
      if (session?.user) cargarPerfil(session.user.id);
      else setEsAdmin(false);
    });
    return () => listener?.subscription?.unsubscribe();
  }, []);

  async function salir() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const links = [
    { href: "/", label: "Partidos" },
    { href: "/jugadores", label: "Jugadores" },
    { href: "/creditos", label: "Créditos" },
    { href: "/perfil", label: "Mi Perfil" },
  ];

  return (
    <nav className="bg-cancha-verdeoscuro text-white shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-0 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
          <span className="text-2xl">⚽</span>
          <span className="text-cancha-amarillo">Gol</span>
          <span>BQTO</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-white/10 text-cancha-amarillo"
                  : "hover:bg-white/10 text-white/80 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
          {esAdmin && (
            <>
              <Link href="/admin" className="px-3 py-2 rounded-lg text-sm font-medium text-cancha-amarillo hover:bg-white/10 transition-colors">
                Admin
              </Link>
              <Link href="/admin/pagos" className="px-3 py-2 rounded-lg text-sm font-medium text-cancha-amarillo hover:bg-white/10 transition-colors">
                Pagos
              </Link>
            </>
          )}
          {usuario ? (
            <button
              onClick={salir}
              className="ml-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              Salir
            </button>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-4 py-2 bg-cancha-amarillo text-cancha-verdeoscuro rounded-lg text-sm font-semibold hover:bg-yellow-400 transition-colors"
            >
              Ingresar
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-white/10"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
          <div className={`w-5 h-0.5 bg-white mb-1 transition-all ${menuOpen ? "opacity-0" : ""}`} />
          <div className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-cancha-verdeoscuro border-t border-white/10 px-4 pb-4 flex flex-col gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/10"
            >
              {label}
            </Link>
          ))}
          {esAdmin && (
            <>
              <Link href="/admin" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium text-cancha-amarillo hover:bg-white/10">
                Admin
              </Link>
              <Link href="/admin/pagos" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg text-sm font-medium text-cancha-amarillo hover:bg-white/10">
                Pagos
              </Link>
            </>
          )}
          {usuario ? (
            <button onClick={salir} className="px-3 py-2 text-left rounded-lg text-sm font-medium hover:bg-white/10">
              Salir
            </button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)} className="px-3 py-2 rounded-lg text-sm font-semibold bg-cancha-amarillo text-cancha-verdeoscuro text-center mt-1">
              Ingresar
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
