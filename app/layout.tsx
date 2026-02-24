import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EstudiApp — Tu planner de estudio con IA',
  description: 'Cargá tus materiales y generá un plan de estudio personalizado con inteligencia artificial',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased font-sans">{children}</body>
    </html>
  )
}
