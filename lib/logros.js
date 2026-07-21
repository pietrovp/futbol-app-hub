export const STAT_OPCIONES = [
  { value: "media_general", label: "Media general (OVR)" },
  { value: "ritmo", label: "Ritmo" },
  { value: "tiro", label: "Tiro" },
  { value: "pase", label: "Pase" },
  { value: "regate", label: "Regate" },
  { value: "defensa", label: "Defensa" },
  { value: "fisico", label: "Físico" },
];

export const REQUISITO_OPCIONES = [
  { value: "partidos_jugados", label: "Partidos jugados" },
  { value: "goles_en_partidos", label: "Goles acumulados en cierta cantidad de partidos" },
  { value: "goles_en_un_partido", label: "Goles en un solo partido" },
  { value: "victorias", label: "Victorias totales" },
  { value: "victorias_seguidas", label: "Victorias seguidas (racha)" },
];

export function statLabel(value) {
  return STAT_OPCIONES.find((s) => s.value === value)?.label || value;
}

export function bonusLabel(logro) {
  return `+${logro.valor_mejora} ${statLabel(logro.stat_mejora)}`;
}

export function requisitoLabel(logro) {
  switch (logro.tipo_requisito) {
    case "partidos_jugados":
      return `Jugar ${logro.requisito_valor} partidos`;
    case "goles_en_partidos":
      return `Anotar ${logro.requisito_valor} goles en ${logro.requisito_partidos ?? "?"} partidos o menos`;
    case "goles_en_un_partido":
      return `Anotar ${logro.requisito_valor} goles en un solo partido`;
    case "victorias":
      return `Ganar ${logro.requisito_valor} partidos`;
    case "victorias_seguidas":
      return `Ganar ${logro.requisito_valor} partidos seguidos`;
    default:
      return "";
  }
}

// Evalúa si un jugador cumple el requisito de un logro, dado un objeto con
// sus estadísticas ya calculadas (partidos_jugados, goles_total, victorias,
// max_goles_partido, racha_victorias_max). Esto SOLO se usa al finalizar un
// partido (panel de organizador) para decidir si desbloquear algo nuevo —
// las páginas de perfil/jugadores nunca reevalúan esto, solo leen
// logros_desbloqueados como fuente de verdad.
export function cumpleRequisito(logro, stats) {
  switch (logro.tipo_requisito) {
    case "partidos_jugados":
      return (stats.partidos_jugados ?? 0) >= logro.requisito_valor;
    case "goles_en_partidos":
      return (
        (stats.goles_total ?? 0) >= logro.requisito_valor &&
        (stats.partidos_jugados ?? 0) <= (logro.requisito_partidos ?? Infinity)
      );
    case "goles_en_un_partido":
      return (stats.max_goles_partido ?? 0) >= logro.requisito_valor;
    case "victorias":
      return (stats.victorias ?? 0) >= logro.requisito_valor;
    case "victorias_seguidas":
      return (stats.racha_victorias_max ?? 0) >= logro.requisito_valor;
    default:
      return false;
  }
}