-- ============================================================
-- Migration 002: Migrar datos de fútbol de perfiles → futbol_profiles
-- Ejecutar DESPUÉS de 001_sports_hub.sql
-- ============================================================
-- 
-- Columnas de perfiles que son de FÚTBOL y se migran:
--   posicion, media_general, ritmo, tiro, pase, regate, defensa, fisico,
--   goles_total, asistencias_total, victorias, derrotas, empates,
--   win_rate, max_goles_partido, racha_victorias_max
--
-- Columnas de perfiles que son BASE y se quedan:
--   id, nombre, telefono, nivel, es_admin, creditos, avatar_url,
--   es_organizador, partidos_jugados, nacionalidad, posicion_preferida
-- ============================================================

-- ──────────────────────────────────────────
-- PASO 1: Migrar datos de fútbol de perfiles → futbol_profiles
-- Solo inserta usuarios que aún no tengan fila en futbol_profiles
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
  created_at
)
SELECT
  p.id                                        AS user_id,
  COALESCE(p.posicion_preferida, p.posicion, 'MED') AS posicion,
  COALESCE(p.media_general, 60)               AS media,
  COALESCE(p.goles_total, 0)                  AS goles,
  COALESCE(p.asistencias_total, 0)            AS asistencias,
  COALESCE(p.ritmo, 60)                       AS ritmo,
  COALESCE(p.tiro, 60)                        AS tiro,
  COALESCE(p.pase, 60)                        AS pase,
  COALESCE(p.regate, 60)                      AS regate,
  COALESCE(p.defensa, 60)                     AS defensa,
  COALESCE(p.fisico, 60)                      AS fisico,
  COALESCE(p.victorias, 0)                    AS victorias,
  COALESCE(p.derrotas, 0)                     AS derrotas,
  NOW()                                       AS created_at
FROM perfiles p
WHERE NOT EXISTS (
  SELECT 1 FROM futbol_profiles fp WHERE fp.user_id = p.id
);

-- ──────────────────────────────────────────
-- PASO 2: Verificación — comprobar que la migración fue correcta
-- Ejecuta esto y comprueba que el count de perfiles y futbol_profiles coincide
-- ──────────────────────────────────────────
SELECT 
  (SELECT COUNT(*) FROM perfiles)         AS total_perfiles,
  (SELECT COUNT(*) FROM futbol_profiles)  AS total_futbol_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM perfiles) = (SELECT COUNT(*) FROM futbol_profiles)
    THEN '✅ Migración correcta — counts coinciden'
    ELSE '⚠️  Revisar — hay diferencia entre tablas'
  END AS resultado;

-- ──────────────────────────────────────────
-- PASO 3 (OPCIONAL — solo ejecutar tras confirmar PASO 2 ✅)
-- Limpiar columnas de fútbol de la tabla perfiles
-- ADVERTENCIA: esto es irreversible. Hacer backup antes.
-- Descomentar solo cuando estés seguro de que la migración fue exitosa.
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
--   DROP COLUMN IF EXISTS max_goles_partido,
--   DROP COLUMN IF EXISTS racha_victorias_max;

-- ──────────────────────────────────────────
-- PASO 4 (OPCIONAL — solo si perfiles_futbol y perfiles_padel están vacías)
-- Eliminar tablas duplicadas que no se usarán
-- ──────────────────────────────────────────

-- DROP TABLE IF EXISTS perfiles_futbol;
-- DROP TABLE IF EXISTS perfiles_padel;
