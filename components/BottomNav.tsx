'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'בית', icon: '🏠' },
  { href: '/plan', label: 'תוכנית', icon: '📅' },
  { href: '/log', label: 'תיעוד', icon: '✍️' },
  { href: '/history', label: 'היסטוריה', icon: '📊' },
  { href: '/explanations', label: 'הסברים', icon: '📖' },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 right-0 left-0 bg-white border-t border-slate-200 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-colors ${
                active ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
