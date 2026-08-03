import { createClient } from "@supabase/supabase-js";

// Este cliente usa la "anon key" pública: es seguro exponerlo en el navegador
// porque Supabase aplicará las reglas de seguridad (Row Level Security)
// definidas en supabase/schema.sql. Nunca pongas aquí la service_role key.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
