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
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmandoSalir, setConfirmandoSalir] = useState(false);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let activo = true;

    async function cargarPerfil(userId) {
      if (!userId) {
        if (!activo) return;
        setEsAdmin(false);
        setCreditos(0);
        setAvatarUrl(null);
        return;
      }

      const { data, error } = await supabase
        .from("perfiles")
        .select("es_admin, creditos, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (!activo) return;

      if (error) {
        console.error("Error cargando perfil navbar:", error);
        setEsAdmin(false);
        setCreditos(0);
        setAvatarUrl(null);
        return;
      }

      setEsAdmin(!!data?.es_admin);
      setCreditos(data?.creditos ?? 0);
      setAvatarUrl(data?.avatar_url ?? null);
    }

    async function iniciar() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!activo) return;

        if (error) {
          console.error("Error obteniendo usuario navbar:", error);
          setUsuario(null);
          setEsAdmin(false);
          setCreditos(0);
          setAvatarUrl(null);
          return;
        }

        setUsuario(user ?? null);
        await cargarPerfil(user?.id ?? null);
      } catch (err) {
        console.error("Error inicializando navbar:", err);
        if (!activo) return;
        setUsuario(null);
        setEsAdmin(false);
        setCreditos(0);
        setAvatarUrl(null);
      }
    }

    iniciar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;

      if (!activo) return;

      setUsuario(user);
      cargarPerfil(user?.id ?? null);
    });

    return () => {
      activo = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Cierra el menú móvil al cambiar de ruta
    setMenuOpen(false);
  }, [pathname]);

  async function salir() {
    if (!supabase || cerrandoSesion) return;

    try {
      setCerrandoSesion(true);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error cerrando sesión:", error);
        return;
      }

      setUsuario(null);
      setEsAdmin(false);
      setCreditos(0);
      setAvatarUrl(null);
      setConfirmandoSalir(false);
      setMenuOpen(false);

      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Error inesperado cerrando sesión:", err);
    } finally {
      setCerrandoSesion(false);
    }
  }

  const mainNav = [
    { href: "/", label: "Partidos" },
    { href: "/jugadores", label: "Jugadores" },
    { href: "/creditos", label: "Créditos" },
  ];

  return (
    <>
      <nav className="w-full bg-white/90 border-b border-gray-200 sticky top-0 z-50 backdrop-blur-md transition-all shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMenuOpen(false)}>
            <span className="text-2xl">⚽</span>
            <span className="text-gray-900 font-black tracking-tight text-lg flex items-center gap-1">
              GOL <span className="text-gray-500 font-medium">BQTO</span>
            </span>
          </Link>

          {/* Navegación principal (desktop) */}
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

          {/* Zona derecha (desktop) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {/* Botón Admin + menú, solo si es admin */}
            {esAdmin && (
              <div className="relative mr-2">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5"
                >
                  Admin
                  <svg
                    className="w-3 h-3"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg text-xs z-50">
                    <Link
                      href="/admin"
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Crear partido
                    </Link>
                    <Link
                      href="/admin/pagos"
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Pagos
                    </Link>
                    <Link
                      href="/admin/logros"
                      className="block w-full text-left px-3 py-2 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      Crear logros
                    </Link>
                  </div>
                )}
              </div>
            )}

            {usuario ? (
              <>
                {/* Créditos */}
                <Link
                  href="/creditos"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-bold hover:bg-yellow-100"
                >
                  <span>{creditos} créditos</span>
                </Link>

                {/* Perfil */}
                <Link
                  href="/perfil"
                  className={`flex items-center gap-2 text-sm font-bold pl-1.5 pr-4 py-1.5 rounded-full transition-all border ${
                    pathname === "/perfil"
                      ? "bg-gray-100 border-gray-300 text-gray-900"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-black text-xs shadow-sm overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Foto de perfil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{usuario.email ? usuario.email[0].toUpperCase() : "U"}</span>
                    )}
                  </div>
                  <span>Perfil</span>
                </Link>

                {/* Salir */}
                <button
                  onClick={() => setConfirmandoSalir(true)}
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

          {/* Botón menú móvil */}
          <button
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 focus:outline-none"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Menú móvil */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 flex flex-col gap-1.5">
            {mainNav.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold ${
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              );
            })}

            {esAdmin && (
              <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-gray-100">
                <Link
                  href="/admin"
                  className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Crear partido
                </Link>
                <Link
                  href="/admin/pagos"
                  className="px-4 py-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 text-sm font-bold text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Pagos
                </Link>
                <Link
                  href="/admin/logros"
                  className="px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-sm font-bold text-center"
                  onClick={() => setMenuOpen(false)}
                >
                  Crear logros
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-3 mt-2 border-t border-gray-100">
              {usuario ? (
                <>
                  <Link
                    href="/creditos"
                    className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-bold"
                    onClick={() => setMenuOpen(false)}
                  >
                    {creditos} créditos
                  </Link>

                  <Link
                    href="/perfil"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 text-sm font-bold"
                    onClick={() => setMenuOpen(false)}
                  >
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-black text-xs overflow-hidden">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{usuario.email ? usuario.email[0].toUpperCase() : "U"}</span>
                      )}
                    </div>
                    Perfil
                  </Link>

                  <button
                    onClick={() => {
                      setConfirmandoSalir(true);
                      setMenuOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 text-left"
                  >
                    Cerrar sesión
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold text-center hover:bg-green-500"
                  onClick={() => setMenuOpen(false)}
                >
                  Ingresar
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Modal de confirmación de salir */}
      {confirmandoSalir && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
          onClick={() => !cerrandoSesion && setConfirmandoSalir(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900">¿Cerrar sesión?</h3>
              <p className="text-sm text-gray-500 mt-1">
                Tendrás que volver a iniciar sesión para acceder a tu cuenta.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmandoSalir(false)}
                disabled={cerrandoSesion}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={salir}
                disabled={cerrandoSesion}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50"
              >
                {cerrandoSesion ? "Cerrando..." : "Sí, cerrar sesión"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
}
