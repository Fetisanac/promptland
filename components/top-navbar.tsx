"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, User, Settings, LogOut, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logout } from "@/app/auth/actions"
import { useRouter } from "next/navigation"
import { NotificationBell } from "@/components/notification-bell"
import { MessageBadge } from "@/components/message-badge"
import { ModeToggle } from "@/components/mode-toggle"

interface TopNavbarProps {
  userInitial?: string
  displayName?: string
  username?: string
}

export function TopNavbar({
  userInitial,
  displayName,
  username,
}: TopNavbarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const profileHref = username ? `/profile/${username}` : "/profile"

  const navItems = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/explore", label: "Keşfet", icon: Search },
    { href: "/messages", label: "Mesajlar", icon: MessageSquare },
    { href: profileHref, label: "Profil", icon: User },
    { href: "/settings", label: "Ayarlar", icon: Settings },
  ]

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <h1 className="text-lg md:text-xl font-semibold text-foreground">
            Promptland
          </h1>
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            // Profil sayfası için pathname kontrolü (username ile eşleşmeli)
            const isActive =
              item.href === profileHref
                ? pathname.startsWith("/profile/")
                : pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.href === "/messages" && <MessageBadge />}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="flex items-center gap-3">
          <ModeToggle />
          <NotificationBell />
          {userInitial && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                {userInitial}
              </div>
              {displayName && (
                <span className="hidden lg:inline text-sm font-medium text-muted-foreground">
                  @{displayName}
                </span>
              )}
            </div>
          )}
          <form action={handleLogout}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  )
}

