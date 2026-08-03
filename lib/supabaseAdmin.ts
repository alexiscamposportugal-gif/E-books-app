import { createClient } from "@supabase/supabase-js";

// ADVERTENCIA: Este cliente usa la "service_role key", que se salta todas
// las reglas de seguridad. SOLO se debe importar dentro de archivos de la
// carpeta app/api/** (código de servidor). Nunca lo importes en un
// componente que se ejecute en el navegador.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
