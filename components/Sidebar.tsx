'use client'

import { LayoutDashboard, FileText, Image, Users, Settings, X, Scissors, TrendingUp, Activity, BarChart3, ChevronDown, ChevronRight, Bell } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Berberler', href: '/barbers', icon: Scissors },
  { name: 'Pazarlama', href: '/marketing', icon: TrendingUp },
  { name: 'Kullanıcılar', href: '/users', icon: Users },
  { name: 'Randevular', href: '/appointments', icon: FileText },
  { name: 'Bildirimler', href: '/notifications', icon: Bell },
  { name: 'Loglar', href: '/logs', icon: Activity },
  { name: 'Görseller', href: '/media', icon: Image },
  { name: 'Ayarlar', href: '/settings', icon: Settings },
]

const analyticsSubmenu = [
  { name: 'Kampanya Performansı', href: '/analytics/campaigns' },
  { name: 'Kullanıcı Davranışı', href: '/analytics/behavior' },
]

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [analyticsOpen, setAnalyticsOpen] = useState(pathname.startsWith('/analytics'))

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-sidebar border-r border-sidebar-border
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sidebar-primary rounded-[var(--radius)] flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold text-sm">K</span>
              </div>
              <span className="text-xl font-bold text-sidebar-foreground">Kestir CMS</span>
            </div>
            <button onClick={onClose} className="lg:hidden">
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-[var(--radius)] transition-all
                    ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}

            {/* Analytics Submenu */}
            <div className="space-y-1">
              <button
                onClick={() => setAnalyticsOpen(!analyticsOpen)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-[var(--radius)] transition-all
                  ${
                    pathname.startsWith('/analytics')
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }
                `}
              >
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Analitik
                </div>
                {analyticsOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>

              {analyticsOpen && (
                <div className="ml-4 space-y-1">
                  {analyticsSubmenu.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={onClose}
                        className={`
                          flex items-center px-4 py-2 text-sm rounded-[var(--radius)] transition-all
                          ${
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                          }
                        `}
                      >
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 p-3 rounded-[var(--radius)] hover:bg-sidebar-accent cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-medium text-sm">AD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Admin User</p>
                <p className="text-xs text-muted-foreground truncate">admin@kestir.com</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
