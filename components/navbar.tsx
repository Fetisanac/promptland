import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/ui/button"
import { logout } from "@/app/auth/actions"
import { NotificationBell } from "@/components/notification-bell"

export async function Navbar() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const displayName =
    (user?.user_metadata as any)?.fullName ||
    (user?.user_metadata as any)?.username ||
    user?.email?.split("@")[0] ||
    ""

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "P"

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold text-foreground">
          Promptland
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          {user && (
            <Link href="/explore" className="text-muted-foreground hover:text-foreground transition-colors">
              Keşfet
            </Link>
          )}
          {user ? (
            <>
              <NotificationBell />
              <Link
                href="/profile"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                  {initial}
                </div>
                <span className="hidden sm:inline font-medium">@{displayName}</span>
              </Link>
              <form action={logout}>
                <Button type="submit" size="sm" variant="outline">
                  Çıkış Yap
                </Button>
              </form>
            </>
          ) : (
            <Link href="/auth/login">
              <Button size="sm">Giriş Yap</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}


