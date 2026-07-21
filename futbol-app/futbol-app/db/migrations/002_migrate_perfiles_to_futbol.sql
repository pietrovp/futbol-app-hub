-- ============================================================
-- Migration 002: Migrar datos de fútbol de perfiles → futbol_profiles
-- Ejecutar DESPUÉS de 001_sports_hub.sql
-- ============================================================

-- ──────────────────────────────────────────
-- PASO 0: Añadir columnas que faltan en futbol_profiles
-- (victorias, derrotas, empates, win_rate, etc.)
-- ──────────────────────────────────────────
ALTER TABLE futbol_profiles
  ADD COLUMN IF NOT EXISTS victorias          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS derrotas           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS empates            INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS win_rate           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS partidos_jugados   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_goles_partido  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS racha_victorias_max INTEGER NOT NULL DEFAULT 0;

-- ──────────────────────────────────────────
-- PASO 1: Migrar datos de fútbol de perfiles → futbol_profiles
-- ──────────────────────────────────────────
INSERT INTO futbol_profiles (
  user_id,
  posicion,
  media,
  goles,
  asistencias,
  ritmo,
  tiro,
  pase,
  regate,
  defensa,
  fisico,
  victorias,
  derrotas,
  empates,
  win_rate,
  partidos_jugados,
  max_goles_partido,
  racha_victorias_max,
  created_at
)
SELECT
  p.id                                              AS user_id,
  COALESCE(p.posicion_preferida, p.posicion, 'MED') AS posicion,
  COALESCE(p.media_general, 60)                     AS media,
  COALESCE(p.goles_total, 0)                        AS goles,
  COALESCE(p.asistencias_total, 0)                  AS asistencias,
  COALESCE(p.ritmo, 60)                             AS ritmo,
  COALESCE(p.tiro, 60)                              AS tiro,
  COALESCE(p.pase, 60)                              AS pase,
  COALESCE(p.regate, 60)                            AS regate,
  COALESCE(p.defensa, 60)                           AS defensa,
  COALESCE(p.fisico, 60)                            AS fisico,
  COALESCE(p.victorias, 0)                          AS victorias,
  COALESCE(p.derrotas, 0)                           AS derrotas,
  COALESCE(p.empates, 0)                            AS empates,
  COALESCE(p.win_rate, 0)                           AS win_rate,
  COALESCE(p.partidos_jugados, 0)                   AS partidos_jugados,
  COALESCE(p.max_goles_partido, 0)                  AS max_goles_partido,
  COALESCE(p.racha_victorias_max, 0)                AS racha_victorias_max,
  NOW()                                             AS created_at
FROM perfiles p
WHERE NOT EXISTS (
  SELECT 1 FROM futbol_profiles fp WHERE fp.user_id = p.id
);

-- ──────────────────────────────────────────
-- PASO 2: Verificación
-- ──────────────────────────────────────────
SELECT
  (SELECT COUNT(*) FROM perfiles)        AS total_perfiles,
  (SELECT COUNT(*) FROM futbol_profiles) AS total_futbol_profiles,
  CASE
    WHEN (SELECT COUNT(*) FROM perfiles) = (SELECT COUNT(*) FROM futbol_profiles)
    THEN '✅ Migración correcta — counts coinciden'
    ELSE '⚠️  Revisar — hay diferencia entre tablas'
  END AS resultado;

-- ──────────────────────────────────────────
-- PASO 3 (OPCIONAL — solo ejecutar tras confirmar PASO 2 ✅)
-- Limpiar columnas de fútbol de la tabla perfiles
-- ADVERTENCIA: irreversible. Descomentar solo cuando estés seguro.
-- ──────────────────────────────────────────

-- ALTER TABLE perfiles
--   DROP COLUMN IF EXISTS posicion,
--   DROP COLUMN IF EXISTS posicion_preferida,
--   DROP COLUMN IF EXISTS media_general,
--   DROP COLUMN IF EXISTS goles_total,
--   DROP COLUMN IF EXISTS asistencias_total,
--   DROP COLUMN IF EXISTS ritmo,
--   DROP COLUMN IF EXISTS tiro,
--   DROP COLUMN IF EXISTS pase,
--   DROP COLUMN IF EXISTS regate,
--   DROP COLUMN IF EXISTS defensa,
--   DROP COLUMN IF EXISTS fisico,
--   DROP COLUMN IF EXISTS victorias,
--   DROP COLUMN IF EXISTS derrotas,
--   DROP COLUMN IF EXISTS empates,
--   DROP COLUMN IF EXISTS win_rate,
--   DROP COLUMN IF EXISTS partidos_jugados,
--   DROP COLUMN IF EXISTS max_goles_partido,
--   DROP COLUMN IF EXISTS racha_victorias_max;

-- ──────────────────────────────────────────
-- PASO 4 (OPCIONAL — borrar tablas duplicadas vacías)
-- ──────────────────────────────────────────

-- DROP TABLE IF EXISTS perfiles_futbol;
-- DROP TABLE IF EXISTS perfiles_padel;
