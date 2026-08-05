import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Este cliente usa la "anon key" pública: es seguro exponerlo en el navegador
// porque Supabase aplicará las reglas de seguridad (Row Level Security)
// definidas en supabase/schema.sql. Nunca pongas aquí la service_role key.
//
// Se crea de forma "perezosa" (solo cuando realmente se usa, no al cargar
// el archivo) para que el proceso de build no falle si en ese momento las
// variables de entorno todavía no están disponibles.
let cliente: SupabaseClient | null = null;

function obtenerClientePublico(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan las variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Configúralas en Vercel > Settings > Environment Variables."
    );
  }

  cliente = createClient(url, key);
  return cliente;
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, propiedad) {
    const real = obtenerClientePublico();
    return Reflect.get(real, propiedad);
  },
});
