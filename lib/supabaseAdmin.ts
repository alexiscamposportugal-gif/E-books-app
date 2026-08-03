import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ADVERTENCIA: Este cliente usa la "service_role key", que se salta todas
// las reglas de seguridad. SOLO se debe importar dentro de archivos de la
// carpeta app/api/** (código de servidor). Nunca lo importes en un
// componente que se ejecute en el navegador.
//
// Se crea de forma "perezosa" (solo cuando realmente se usa, no al cargar
// el archivo) para que el proceso de build de Vercel no falle si todavía
// no configuraste las variables de entorno.
let cliente: SupabaseClient | null = null;

function obtenerClienteAdmin(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Configúralas en Vercel > Settings > Environment Variables."
    );
  }

  cliente = createClient(url, key, { auth: { persistSession: false } });
  return cliente;
}

// Se exporta como un "proxy": el código que lo usa sigue escribiendo
// supabaseAdmin.from(...) exactamente igual que antes, pero por dentro
// el cliente real solo se crea la primera vez que se usa.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, propiedad) {
    const real = obtenerClienteAdmin();
    return Reflect.get(real, propiedad);
  },
});

