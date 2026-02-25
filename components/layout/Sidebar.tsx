'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, BookMarked, Calendar,
  BarChart2, Settings, LogOut, GraduationCap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/subjects', label: 'Materias', icon: BookMarked },
  { href: '/calendar', label: 'Calendario', icon: Calendar },
  { href: '/progress', label: 'Progreso', icon: BarChart2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-sidebar fixed left-0 top-0 z-30 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-sidebar-border">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-600">
          <GraduationCap className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-sidebar-fg-active text-[15px] tracking-tight">EstudiApp</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors',
                active
                  ? 'bg-sidebar-active-bg text-sidebar-fg-active'
                  : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'opacity-100' : 'opacity-60')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-2 pb-3 space-y-0.5 border-t border-sidebar-border pt-3">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2.5 px-3 py-2 rounded-md text-[13.5px] font-medium transition-colors w-full',
            pathname.startsWith('/settings')
              ? 'bg-sidebar-active-bg text-sidebar-fg-active'
              : 'text-sidebar-fg hover:bg-sidebar-hover hover:text-sidebar-fg-active'
          )}
        >
          <Settings className={cn('w-4 h-4 flex-shrink-0', pathname.startsWith('/settings') ? 'opacity-100' : 'opacity-60')} />
          Configuración
        </Link>

        <div className="flex items-center gap-1 px-3 py-1.5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2.5 flex-1 py-0.5 text-[13.5px] font-medium text-sidebar-fg hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0 opacity-60" />
            Cerrar sesión
          </button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
