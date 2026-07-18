"use client";

/**
 * PlayerCard: carta estilo FIFA Ultimate Team
 * Props:
 *   - nombre: string
 *   - posicion: string (e.g. "DEL", "MED", "DEF", "POR")
 *   - media: number (0-99)
 *   - stats: { ritmo, tiro, pase, regate, defensa, fisico } (0-99 cada uno)
 *   - nivel: number (1-5)
 *   - partidosJugados: number
 *   - goles: number
 *   - asistencias: number
 *   - avatar: string (URL opcional)
 */

function getRareza(media) {
  if (media >= 91) {
    return {
      label: "TOTY",
      gradiente: "from-blue-900 via-blue-700 to-blue-900",
      textoNivel: "text-blue-200",
      borde: "border-2 border-blue-300",
      glow: "shadow-[0_0_25px_rgba(96,165,250,0.6)]",
      barraColor: "bg-blue-300",
      nombreColor: "text-white",
      statTexto: "text-white/80",
      statTextoLabel: "text-white/60",
      brillo: "toty-shine",
      solido: false,
    };
  }
  if (media >= 86) {
    return {
      label: "ICONO",
      gradiente: "",
      solidoBg: "#E6E4E3",
      textoNivel: "text-[#594D2C]",
      borde: "border-[3px] border-yellow-500",
      glow: "shadow-[0_0_18px_rgba(234,179,8,0.4)]",
      barraColor: "bg-[#594D2C]",
      nombreColor: "text-[#594D2C]",
      statTexto: "text-[#594D2C]",
      statTextoLabel: "text-[#594D2C]/70",
      brillo: "card-shine",
      solido: true,
    };
  }
  if (media >= 81) {
    return {
      label: "Oro brillante",
      gradiente: "from-yellow-300 via-yellow-500 to-amber-600",
      textoNivel: "text-yellow-900",
      borde: "border-2 border-yellow-200",
      glow: "shadow-[0_0_16px_rgba(250,204,21,0.5)]",
      barraColor: "bg-white",
      nombreColor: "text-yellow-950",
      statTexto: "text-yellow-950/80",
      statTextoLabel: "text-yellow-950/60",
      brillo: "card-shine",
      solido: false,
    };
  }
  if (media >= 75) {
    return {
      label: "Oro",
      gradiente: "from-yellow-500 to-yellow-700",
      textoNivel: "text-yellow-100",
      borde: "border border-yellow-300/50",
      glow: "shadow-lg",
      barraColor: "bg-yellow-200",
      nombreColor: "text-white",
      statTexto: "text-white/80",
      statTextoLabel: "text-white/60",
      brillo: "card-shine",
      solido: false,
    };
  }
  if (media >= 70) {
    return {
      label: "Plata",
      gradiente: "from-gray-300 to-gray-500",
      textoNivel: "text-gray-100",
      borde: "border border-gray-200/60",
      glow: "shadow-lg",
      barraColor: "bg-gray-100",
      nombreColor: "text-white",
      statTexto: "text-white/80",
      statTextoLabel: "text-white/60",
      brillo: "card-shine",
      solido: false,
    };
  }
  return {
    label: "Bronce",
    gradiente: "from-amber-700 to-amber-900",
    textoNivel: "text-amber-200",
    borde: "border border-amber-600/50",
    glow: "shadow-lg",
    barraColor: "bg-amber-300",
    nombreColor: "text-white",
    statTexto: "text-white/80",
    statTextoLabel: "text-white/60",
    brillo: "card-shine",
    solido: false,
  };
}

function StatBar({ label, value, color, textoValor, textoLabel }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-xs font-bold w-8 ${textoValor}`}>{value}</span>
      <div className="flex-1 bg-black/10 rounded-full h-1">
        <div
          className={`h-1 rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs w-6 ${textoLabel}`}>{label}</span>
    </div>
  );
}

export default function PlayerCard({
  nombre = "Jugador",
  posicion = "DEL",
  media = 70,
  stats = { ritmo: 70, tiro: 68, pase: 65, regate: 72, defensa: 40, fisico: 66 },
  nivel = 1,
  partidosJugados = 0,
  goles = 0,
  asistencias = 0,
  avatar = null,
  mini = false,
}) {
  const r = getRareza(media);

  const fondoClase = r.solido ? "" : `bg-gradient-to-br ${r.gradiente}`;
  const fondoStyle = r.solido ? { backgroundColor: r.solidoBg } : {};

  if (mini) {
    return (
      <div
        className={`relative ${r.brillo} ${fondoClase} ${r.borde} ${r.glow} rounded-xl p-3 w-28 flex flex-col items-center gap-1`}
        style={fondoStyle}
      >
        <span className={`text-xs font-bold ${r.textoNivel}`}>{r.label}</span>
        <span className={`text-2xl font-black ${r.nombreColor}`}>{media}</span>
        <span className={`text-xs font-bold ${r.nombreColor}`}>{posicion}</span>
        <div className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center text-lg">
          {avatar ? <img src={avatar} className="w-10 h-10 rounded-full object-cover" alt={nombre} /> : "👤"}
        </div>
        <span className={`text-xs font-semibold text-center leading-tight ${r.nombreColor}`}>{nombre}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${r.brillo} ${fondoClase} ${r.borde} ${r.glow} rounded-2xl p-5 w-full max-w-xs mx-auto`}
      style={fondoStyle}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={`text-4xl font-black leading-none ${r.nombreColor}`}>{media}</div>
          <div className={`text-sm font-bold mt-0.5 ${r.nombreColor}`}>{posicion}</div>
          <div className={`text-xs mt-1 font-semibold ${r.textoNivel}`}>{r.label}</div>
        </div>
        <div className="w-20 h-20 rounded-xl bg-black/10 overflow-hidden flex items-center justify-center text-4xl">
          {avatar
            ? <img src={avatar} className="w-full h-full object-cover" alt={nombre} />
            : "👤"}
        </div>
      </div>

      <div className={`text-center font-black text-lg tracking-wide mb-3 drop-shadow ${r.nombreColor}`}>
        {nombre.toUpperCase()}
      </div>

      <div className="flex flex-col gap-1.5 mb-3">
        <StatBar label="RIT" value={stats.ritmo} color={r.barraColor} textoValor={r.statTexto} textoLabel={r.statTextoLabel} />
        <StatBar label="TIR" value={stats.tiro} color={r.barraColor} textoValor={r.statTexto} textoLabel={r.statTextoLabel} />
        <StatBar label="PAS" value={stats.pase} color={r.barraColor} textoValor={r.statTexto} textoLabel={r.statTextoLabel} />
        <StatBar label="REG" value={stats.regate} color={r.barraColor} textoValor={r.statTexto} textoLabel={r.statTextoLabel} />
        <StatBar label="DEF" value={stats.defensa} color={r.barraColor} textoValor={r.statTexto} textoLabel={r.statTextoLabel} />
        <StatBar label="FIS" value={stats.fisico} color={r.barraColor} textoValor={r.statTexto} textoLabel={r.statTextoLabel} />
      </div>

      <div className={`flex justify-around border-t pt-3 text-center ${r.solido ? "border-[#594D2C]/20" : "border-white/20"}`}>
        <div>
          <div className={`text-lg font-bold ${r.nombreColor}`}>{partidosJugados}</div>
          <div className={`text-xs ${r.solido ? "text-[#594D2C]/70" : "opacity-70 text-white"}`}>Partidos</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${r.nombreColor}`}>{goles}</div>
          <div className={`text-xs ${r.solido ? "text-[#594D2C]/70" : "opacity-70 text-white"}`}>Goles</div>
        </div>
        <div>
          <div className={`text-lg font-bold ${r.nombreColor}`}>{asistencias}</div>
          <div className={`text-xs ${r.solido ? "text-[#594D2C]/70" : "opacity-70 text-white"}`}>Asist.</div>
        </div>
      </div>
    </div>
  );
}