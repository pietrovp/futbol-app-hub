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
  const [creditos, setCreditos] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function cargarSesion() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      setUsuario(user ?? null);

      if (user) {
        const { data } = await supabase
          .from("perfiles")
          .select("es_admin, creditos")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        setEsAdmin(!!data?.es_admin);
        setCreditos(data?.creditos ?? 0);
      } else {
        setEsAdmin(false);
        setCreditos(0);
      }
    }

    cargarSesion();

    return () => {
      mounted = false;
    };
  }, []);

  async function salir() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const mainNav = [
    { href: "/", label: "Partidos" },
    { href: "/jugadores", label: "Jugadores" },
    { href: "/creditos", label: "Créditos" },
  ];

  return (
    <nav className="w-full bg-white/90 border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md transition-all shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
          <span className="text-2xl">⚽</span>
          <span className="text-gray-900 font-black tracking-tight text-lg flex items-center gap-1">
            GOL <span className="text-gray-500 font-medium">BQTO</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center p-1 bg-gray-100 rounded-full border border-gray-200/80">
          {mainNav.map(({ href, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm border border-gray-200/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-4">
          {esAdmin && (
            <div className="flex items-center gap-3 mr-2 border-r border-gray-300 pr-4">
              <Link
                href="/admin"
                className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100"
              >
                Crear partido
              </Link>
              <Link
                href="/admin/pagos"
                className="px-4 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold hover:bg-sky-100"
              >
                Pagos
              </Link>
            </div>
          )}

          {usuario ? (
            <>
              <Link
                href="/creditos"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-bold hover:bg-yellow-100"
              >
                <span>{creditos} créditos</span>
              </Link>

              <Link
                href="/perfil"
                className={`flex items-center gap-2 text-sm font-bold pl-1.5 pr-4 py-1.5 rounded-full transition-all border ${
                  pathname === "/perfil"
                    ? "bg-gray-100 border-gray-300 text-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                  {usuario.email ? usuario.email[0].toUpperCase() : "U"}
                </div>
                <span>Perfil</span>
              </Link>

              <button
                onClick={salir}
                title="Cerrar sesión"
                className="text-gray-400 hover:text-red-600 transition-colors p-2 rounded-full hover:bg-red-50 ml-1"
              >
                Salir
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="px-5 py-2 bg-green-600 text-white rounded-full text-sm font-bold hover:bg-green-500 transition-colors shadow-sm"
            >
              Ingresar
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 text-gray-500 hover:text-gray-900 focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú"
        >
          ☰
        </button>
      </div>
    </nav>
  );
}