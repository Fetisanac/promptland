"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, MessageCircle, UserPlus } from "lucide-react"
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/app/actions/notification"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  type: "LIKE" | "COMMENT" | "FOLLOW"
  read: boolean
  postId: string | null
  createdAt: string
  issuer: {
    id: string
    username: string
    fullName: string
    avatarUrl: string | null
  }
}

interface NotificationsClientProps {
  initialNotifications: Notification[]
}

export function NotificationsClient({
  initialNotifications,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<"ALL" | "LIKE" | "COMMENT" | "FOLLOW">("ALL")
  const [isPending, startTransition] = useTransition()

  const filteredNotifications =
    filter === "ALL"
      ? notifications
      : notifications.filter((n) => n.type === filter)

  const unreadCount = notifications.filter((n) => !n.read).length

  const formatDate = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Az önce"
    if (minutes < 60) return `${minutes} dakika önce`
    if (hours < 24) return `${hours} saat önce`
    if (days < 7) return `${days} gün önce`
    return date.toLocaleDateString("tr-TR")
  }

  const getNotificationText = (notification: Notification) => {
    const issuerName = notification.issuer.fullName || notification.issuer.username
    switch (notification.type) {
      case "LIKE":
        return `${issuerName} gönderini beğendi`
      case "COMMENT":
        return `${issuerName} gönderine yorum yaptı`
      case "FOLLOW":
        return `${issuerName} seni takip etti`
      default:
        return ""
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "LIKE":
        return <Heart className="h-4 w-4 text-primary" />
      case "COMMENT":
        return <MessageCircle className="h-4 w-4 text-primary" />
      case "FOLLOW":
        return <UserPlus className="h-4 w-4 text-primary" />
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.read) return

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n,
      ),
    )

    startTransition(async () => {
      const result = await markNotificationAsRead(notification.id)
      if (result.error) {
        // Hata durumunda geri al
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: false } : n,
          ),
        )
      }
    })
  }

  const handleMarkAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)

    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true })),
    )

    startTransition(async () => {
      const result = await markAllNotificationsAsRead()
      if (result.error) {
        // Hata durumunda geri al
        setNotifications((prev) =>
          prev.map((n) =>
            unreadIds.includes(n.id) ? { ...n, read: false } : n,
          ),
        )
      }
    })
  }

  const getNotificationLink = (notification: Notification) => {
    if (notification.postId) {
      return `/prompt/${notification.postId}`
    }
    if (notification.type === "FOLLOW") {
      return `/profile/${notification.issuer.username}`
    }
    return "#"
  }

  return (
    <div className="space-y-6">
      {/* Filtre Butonları */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => setFilter("ALL")}
          variant={filter === "ALL" ? "default" : "outline"}
          size="sm"
        >
          Tümü
        </Button>
        <Button
          onClick={() => setFilter("LIKE")}
          variant={filter === "LIKE" ? "default" : "outline"}
          size="sm"
        >
          Beğeniler
        </Button>
        <Button
          onClick={() => setFilter("COMMENT")}
          variant={filter === "COMMENT" ? "default" : "outline"}
          size="sm"
        >
          Yorumlar
        </Button>
        <Button
          onClick={() => setFilter("FOLLOW")}
          variant={filter === "FOLLOW" ? "default" : "outline"}
          size="sm"
        >
          Takipler
        </Button>
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            variant="ghost"
            size="sm"
            disabled={isPending}
            className="ml-auto"
          >
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      {/* Bildirim Listesi */}
      {filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
          Bildirim bulunamadı.
        </div>
      ) : (
        <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
          {filteredNotifications.map((notification) => (
            <Link
              key={notification.id}
              href={getNotificationLink(notification)}
              onClick={() => handleNotificationClick(notification)}
              className={`flex items-center gap-4 p-4 transition-colors ${
                notification.read
                  ? "hover:bg-muted"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              {/* Okunmamış Göstergesi */}
              {!notification.read && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary" />
              )}
              
              {/* Avatar */}
              <div className="flex-shrink-0">
                {notification.issuer.avatarUrl ? (
                  <div className="relative h-12 w-12 overflow-hidden rounded-full">
                    <Image
                      src={notification.issuer.avatarUrl}
                      alt={notification.issuer.username}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                    {(notification.issuer.fullName || notification.issuer.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
              </div>

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getNotificationIcon(notification.type)}
                  <p className={`text-sm ${notification.read ? "text-foreground" : "font-semibold text-foreground"}`}>
                    {getNotificationText(notification)}
                  </p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(notification.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}





