"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell } from "lucide-react"
import { getUnreadNotificationCount } from "@/app/actions/notification"

export function NotificationBell() {
  const [count, setCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    // Sayfa yüklendiğinde sayıyı al
    const fetchCount = async () => {
      const result = await getUnreadNotificationCount()
      if (result.count !== undefined) {
        setCount(result.count)
      }
    }

    fetchCount()

    // Her 30 saniyede bir sayıyı güncelle
    const interval = setInterval(fetchCount, 30000)

    // Bildirim sayfasından dönüldüğünde sayıyı güncelle
    if (pathname === "/notifications") {
      fetchCount()
    }

    return () => clearInterval(interval)
  }, [pathname])

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
    >
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute right-1 top-1 flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white animate-pulse">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  )
}

