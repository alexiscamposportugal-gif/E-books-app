-- ============================================================
-- Ejecuta este archivo en: Supabase Dashboard > SQL Editor > New query
-- Copia y pega todo, luego dale a "Run".
-- ============================================================

-- Tabla de libros (uno por cada PDF que subas como admin)
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  original_filename text,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  portada_url text,
  interactive_content jsonb,           -- aquí vive el resultado generado por la IA
  status text not null default 'processing', -- processing | ready | failed
  created_at timestamptz not null default now()
);

-- Si la tabla "books" ya existía de antes (versión previa de esta app),
-- esta línea agrega la columna nueva sin borrar nada de lo que ya tenías:
alter table public.books add column if not exists portada_url text;

-- Bucket de almacenamiento público para las imágenes de portada
insert into storage.buckets (id, name, public)
values ('portadas', 'portadas', true)
on conflict (id) do nothing;

-- Tabla de licencias (una fila por cada venta = un acceso único)
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  buyer_email text not null,
  access_token text not null unique,   -- token firmado que va en el enlace
  max_devices integer not null default 2,
  devices_used jsonb not null default '[]'::jsonb,
  expires_at timestamptz,              -- null = no expira
  revoked boolean not null default false,
  stripe_session_id text,
  created_at timestamptz not null default now()
);

-- Progreso de lectura por comprador (para guardar avance en quizzes, etc.)
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SEGURIDAD: activar Row Level Security
-- Con esto, aunque alguien tenga la anon key pública, NO puede
-- leer libros ni licencias directamente sin pasar por tu backend.
-- Todo el acceso sensible se hace con la service_role key desde
-- las rutas app/api/**, que sí validan el token antes de responder.
-- ============================================================
alter table public.books enable row level security;
alter table public.licenses enable row level security;
alter table public.progress enable row level security;

-- Nadie puede leer directamente desde el navegador (bloqueado por defecto).
-- Todas las lecturas/escrituras pasan por las API routes del servidor.
