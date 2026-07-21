"use client";

import Link from "next/link";

export default function HubHome() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl md:text-4xl font-black mb-2 text-center">
        Bienvenido al hub deportivo
      </h1>
      <p className="text-sm text-gray-300 mb-8 text-center max-w-md">
        Usa la misma cuenta para jugar Fútbol, Pádel y más deportes en un solo lugar.
      </p>

      <div className="flex gap-4 mb-10">
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-white text-gray-900 text-sm font-bold hover:bg-zinc-200"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/registro"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500"
        >
          Registrarse
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
        <Link
          href="/futbol"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-500/40 shadow-lg cursor-pointer"
        >
          <div className="absolute inset-0 opacity-40 bg-[url('/images/futbol.jpg')] bg-cover bg-center group-hover:opacity-60 transition-opacity" />
          <div className="relative p-6 flex flex-col justify-between h-full">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 text-xs font-bold uppercase tracking-wider">
                ⚽ Fútbol
              </span>
              <h2 className="mt-4 text-2xl font-black">Juega partidos de fútbol</h2>
              <p className="mt-2 text-sm text-emerald-100">
                Organiza partidos, lleva tus estadísticas y mejora tu carta de jugador.
              </p>
            </div>
            <p className="mt-4 text-xs text-emerald-100/80">Toca para entrar a tu experiencia de fútbol.</p>
          </div>
        </Link>

        <Link
          href="/padel"
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-500/40 shadow-lg cursor-pointer"
        >
          <div className="absolute inset-0 opacity-40 bg-[url('/images/padel.jpg')] bg-cover bg-center group-hover:opacity-60 transition-opacity" />
          <div className="relative p-6 flex flex-col justify-between h-full">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 text-xs font-bold uppercase tracking-wider">
                🎾 Pádel
              </span>
              <h2 className="mt-4 text-2xl font-black">Reserva y juega pádel</h2>
              <p className="mt-2 text-sm text-blue-100">
                Próximamente podrás gestionar tus reservas y estadísticas de pádel.
              </p>
            </div>
            <p className="mt-4 text-xs text-blue-100/80">Toca para entrar a la sección de pádel.</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
