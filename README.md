# EstudiApp

Planner de estudio personalizado con IA. Cargá tus materiales y generá un plan adaptado a tu fecha de examen.

## ¿Qué hace?

- Cargá materiales por materia: PDFs, YouTube, notas de texto, fotos de apuntes
- Generá un plan de estudio con IA: distribuye los temas día a día hasta el examen
- Practicá con preguntas generadas automáticamente desde tus materiales
- Seguí tu progreso con estadísticas y gráficos
- Funciona en PC y celular

## Setup

### 1. Supabase (base de datos — gratis)

1. Ir a supabase.com → crear proyecto
2. Settings → API → copiar: Project URL, anon public key, service_role key
3. SQL Editor → ejecutar todo el contenido de `supabase/migrations/001_initial_schema.sql`

### 2. Groq (IA — 100% gratis)

1. Ir a console.groq.com → registrarse con Google
2. API Keys → Create API Key → copiar la clave (empieza con `gsk_...`)

### 3. Variables de entorno

Editar `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
GROQ_API_KEY=gsk_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Ejecutar localmente

```bash
npm run dev
```

Abrir: http://localhost:3000

### 5. Deploy en Vercel (gratis)

1. Subir a GitHub
2. vercel.com → Import → seleccionar repo
3. Agregar las mismas variables de entorno
4. Deploy

## Tecnologías

- Next.js 14 (frontend + backend)
- Supabase (DB + Auth + Storage)
- Groq (Llama 3.3 70B) — IA gratuita
- Tailwind CSS
- pdf-parse, youtube-transcript, Tesseract.js, Recharts

## Dev

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
