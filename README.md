# 📚 eBooks Interactivos — MVP

Esta app convierte un PDF en una mini-app interactiva (capítulos + preguntas de
comprensión generadas por IA), la vende con Stripe, y entrega a cada comprador
un enlace único y protegido que solo él puede usar.

Todo el stack usado tiene capa **gratuita**: GitHub, Vercel, Supabase, Stripe (modo test).
Todo el stack, incluyendo la IA (Google Gemini), es 100% gratuito para empezar.

---

## 0. Qué vas a necesitar (todo gratis para crear cuenta)

- Cuenta en [GitHub](https://github.com)
- Cuenta en [Vercel](https://vercel.com) (puedes entrar directamente con tu cuenta de GitHub)
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Stripe](https://stripe.com) (usa el modo "Test" mientras no cobres de verdad)
- Una clave gratis de [Google AI Studio / Gemini](https://aistudio.google.com/apikey) (no pide tarjeta de crédito)

---

## 1. Subir este código a GitHub

1. Entra a github.com → botón verde **"New"** → crea un repositorio (ej. `ebooks-interactivos`), **privado**.
2. En tu computadora, dentro de esta carpeta del proyecto, abre una terminal y ejecuta:
   ```bash
   git init
   git add .
   git commit -m "Primera versión de la app"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/ebooks-interactivos.git
   git push -u origin main
   ```
   (Reemplaza `TU-USUARIO` por tu usuario de GitHub. Si nunca usaste `git`, GitHub te
   muestra estos mismos comandos exactos al crear el repositorio, solo cópialos).

---

## 2. Crear la base de datos en Supabase

1. Entra a supabase.com → **New Project** (elige la región más cercana a ti).
2. Cuando el proyecto esté listo, ve a **SQL Editor** → **New query**.
3. Abre el archivo `supabase/schema.sql` de este proyecto, copia todo su contenido,
   pégalo ahí y dale **Run**. Esto crea las tablas `books`, `licenses` y `progress`.
4. Ve a **Project Settings > API** y copia estos 3 valores (los usarás en el paso 4):
   - `Project URL` → será tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → será tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → será tu `SUPABASE_SERVICE_ROLE_KEY` (¡nunca la compartas públicamente!)

---

## 3. Configurar Stripe (modo prueba, sin dinero real)

1. Entra a tu dashboard de Stripe, asegúrate de estar en modo **Test**.
2. Ve a **Developers > API keys** y copia la **Secret key** → `STRIPE_SECRET_KEY`.
3. Ve a **Developers > Webhooks > Add endpoint**.
   - URL del endpoint: `https://TU-DOMINIO-DE-VERCEL.vercel.app/api/webhook`
     (este dominio lo obtienes después de desplegar en el paso 5; puedes volver
     a este paso y editarlo luego).
   - Evento a escuchar: `checkout.session.completed`
   - Copia el **Signing secret** → `STRIPE_WEBHOOK_SECRET`

---

## 4. Configurar las variables de entorno en Vercel

1. Entra a vercel.com → **Add New > Project** → importa tu repositorio de GitHub.
2. Antes de darle "Deploy", abre la sección **Environment Variables** y añade,
   una por una, todas las que están listadas en el archivo `.env.example` de este
   proyecto, con tus valores reales (Supabase, Stripe, Gemini, y también:
   - `JWT_SECRET`: cualquier frase larga aleatoria que inventes tú
   - `ADMIN_SECRET`: la contraseña que usarás para entrar a `/admin`
   - `NEXT_PUBLIC_APP_URL`: la pondrás después de tener el dominio, ej.
     `https://ebooks-interactivos.vercel.app`
3. Dale **Deploy**. En unos 2 minutos tendrás tu app en línea con una URL pública.
4. Vuelve a editar `NEXT_PUBLIC_APP_URL` con la URL real que te dio Vercel, y
   vuelve a desplegar (Vercel > Deployments > los tres puntos > Redeploy).

---

## 5. Probar el flujo completo

1. Entra a `https://tu-app.vercel.app/admin`, escribe tu `ADMIN_SECRET`, sube un
   PDF de prueba (corto, para probar rápido) y espera a que termine de procesar.
2. Copia el enlace `/comprar/ID-DEL-LIBRO` que te muestra, ábrelo.
3. Paga con una [tarjeta de prueba de Stripe](https://docs.stripe.com/testing),
   por ejemplo `4242 4242 4242 4242`, cualquier fecha futura y cualquier CVC.
4. Revisa los "logs" de tu proyecto en Vercel (pestaña **Logs**): ahí verás el
   enlace de acceso único que se generó (por ahora se imprime en el log en vez
   de enviarse por correo real — ver "Próximos pasos" abajo).
5. Abre ese enlace `/libro/ID?token=...` y confirma que puedes navegar los
   capítulos y responder el quiz.

---

## 6. Próximos pasos recomendados (para cuando ya funcione lo básico)

- **Enviar el enlace por correo de verdad**: conecta un servicio gratuito como
  [Resend](https://resend.com) (100 correos/día gratis) en `app/api/webhook/route.ts`,
  donde ahora mismo solo hace `console.log`.
- **Libros muy largos**: `generarInteractivo.ts` recorta el texto a 100,000
  caracteres. Para libros más largos habría que procesarlos por bloques.
- **Panel de ventas**: una página en `/admin` para ver todas las licencias
  vendidas y poder revocar accesos manualmente (ya existe la columna `revoked`
  en la base de datos, solo falta la pantalla).
- **Página de "gracias" tras el pago** (`/gracias`): actualmente Stripe
  redirige ahí pero la página no existe todavía.

Si en cualquier momento te trabas en alguno de estos pasos, puedes volver a
este chat y pedirme que te ayude a construir esa parte específica.
