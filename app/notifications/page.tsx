import { redirect } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { NotificationsClient } from "@/components/notifications-client"

export default async function NotificationsPage() {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login")
  }

  // Kullanıcıyı Prisma'da kontrol et
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
  })

  if (!dbUser) {
    redirect("/auth/login")
  }

  // Bildirimleri çek
  const notifications = await prisma.notification.findMany({
    where: { recipientId: authUser.id },
    orderBy: { createdAt: "desc" },
    include: {
      issuer: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
        },
      },
    },
    take: 100, // Son 100 bildirim
  })

  // Bildirimleri serialize et
  const formattedNotifications = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    read: n.read,
    postId: n.postId,
    createdAt: n.createdAt.toISOString(),
    issuer: {
      id: n.issuer.id,
      username: n.issuer.username,
      fullName: n.issuer.fullName,
      avatarUrl: n.issuer.avatarUrl,
    },
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Bildirimler</h1>
        <NotificationsClient initialNotifications={formattedNotifications} />
      </div>
    </div>
  )
}





