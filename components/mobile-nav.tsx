"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, User, Settings, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { MessageBadge } from "@/components/message-badge"

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "Ana Sayfa",
      icon: Home,
    },
    {
      href: "/explore",
      label: "Keşfet",
      icon: Search,
    },
    {
      href: "/messages",
      label: "Mesajlar",
      icon: MessageSquare,
    },
    {
      href: "/profile",
      label: "Profil",
      icon: User,
    },
    {
      href: "/settings",
      label: "Ayarlar",
      icon: Settings,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.href === "/messages" && <MessageBadge />}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}



