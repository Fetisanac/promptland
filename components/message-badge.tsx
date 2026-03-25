"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { getUnreadMessageCount } from "@/app/actions/message"

export function MessageBadge() {
  const [count, setCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    // Sayfa yüklendiğinde sayıyı al
    const fetchCount = async () => {
      const result = await getUnreadMessageCount()
      if (result.count !== undefined) {
        setCount(result.count)
      }
    }

    fetchCount()

    // Her 30 saniyede bir sayıyı güncelle
    const interval = setInterval(fetchCount, 30000)

    // Mesaj sayfasından dönüldüğünde sayıyı güncelle
    if (pathname?.startsWith("/messages")) {
      fetchCount()
    }

    return () => clearInterval(interval)
  }, [pathname])

  if (count === 0) {
    return null
  }

  return (
    <span className="absolute -top-1 -right-1 flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white animate-pulse">
      {count > 9 ? "9+" : count}
    </span>
  )
}







