"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Bildirimin kullanıcıya ait olduğunu kontrol et
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { recipientId: true },
    })

    if (!notification || notification.recipientId !== user.id) {
      return { error: "Bildirim bulunamadı." }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    })

    revalidatePath("/notifications")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Bildirim okundu işaretleme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Bildirim işaretlenirken bir hata oluştu.",
    }
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: user.id,
        read: false,
      },
      data: { read: true },
    })

    revalidatePath("/notifications")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Tüm bildirimleri okundu işaretleme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Bildirimler işaretlenirken bir hata oluştu.",
    }
  }
}

export async function getUnreadNotificationCount() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { count: 0 }
    }

    const count = await prisma.notification.count({
      where: {
        recipientId: user.id,
        read: false,
      },
    })

    return { count }
  } catch (error) {
    console.error("Okunmamış bildirim sayısı alınırken hata:", error)
    return { count: 0 }
  }
}

