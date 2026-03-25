"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, User, Settings, Sparkles, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CreatePromptDialog } from "./create-prompt-dialog"

export function LeftSidebar() {
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
      href: "/notifications",
      label: "Bildirimler",
      icon: Bell,
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
    <aside className="sticky top-0 h-screen w-64 border-r border-border bg-background">
      <div className="flex h-full flex-col p-6">
        {/* Logo */}
        <Link href="/" className="mb-8">
          <h1 className="text-xl font-semibold text-foreground">
            Promptland
          </h1>
        </Link>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* New Prompt Button */}
        <div className="mt-auto pt-4">
          <CreatePromptDialog>
            <Button
              className="w-full"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Yeni Prompt
            </Button>
          </CreatePromptDialog>
        </div>
      </div>
    </aside>
  )
}

