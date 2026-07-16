import { createClient } from "@supabase/supabase-js";

// Estas dos variables se configuran en el archivo .env.local
// (ver README.md, paso "Conectar la base de datos")
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
