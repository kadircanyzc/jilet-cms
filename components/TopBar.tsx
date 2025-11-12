'use client'

import { Search, Bell, Menu } from 'lucide-react'

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu + Search */}
        <div className="flex items-center flex-1 space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-[var(--radius)] hover:bg-accent"
          >
            <Menu className="w-6 h-6 text-foreground" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ara..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-input-background border border-border rounded-[var(--radius)] focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Right: Notifications + Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-[var(--radius)] hover:bg-accent">
            <Bell className="w-6 h-6 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-3 cursor-pointer hover:bg-accent rounded-[var(--radius)] p-2">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-sm">AD</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-foreground">Admin User</p>
              <p className="text-xs text-muted-foreground">Super Admin</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
