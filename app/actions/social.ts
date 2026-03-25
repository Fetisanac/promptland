"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

export async function toggleLike(promptId: string) {
  try {
    // Oturum kontrolü
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Kullanıcıyı Prisma'da kontrol et (yoksa oluştur)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      // Username için e-postanın '@' işaretinden önceki kısmını al ve rastgele 3 hane ekle
      const emailPrefix = user.email!.split("@")[0]
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")
      const username = `${emailPrefix}${randomSuffix}`

      // fullName için metadata'dan al, yoksa kullanıcı adını kullan
      const fullName =
        (user.user_metadata as any)?.fullName ||
        (user.user_metadata as any)?.name ||
        user.email!.split("@")[0] ||
        ""

      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          username: username,
          fullName: fullName,
        },
      })
    }

    // Mevcut beğeniyi kontrol et
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_promptId: {
          userId: user.id,
          promptId: promptId,
        },
      },
    })

    if (existingLike) {
      // Beğeniyi kaldır (Unlike)
      await prisma.like.delete({
        where: {
          userId_promptId: {
            userId: user.id,
            promptId: promptId,
          },
        },
      })
    } else {
      // Beğeniyi ekle (Like)
      await prisma.like.create({
        data: {
          userId: user.id,
          promptId: promptId,
        },
      })

      // Post sahibini bul ve bildirim oluştur (kendi postunu beğenirse bildirim oluşturma)
      const prompt = await prisma.prompt.findUnique({
        where: { id: promptId },
        select: { userId: true },
      })

      if (prompt && prompt.userId !== user.id) {
        await prisma.notification.create({
          data: {
            recipientId: prompt.userId,
            issuerId: user.id,
            postId: promptId,
            type: "LIKE",
          },
        })
        revalidatePath("/notifications")
      }
    }

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath(`/prompt/${promptId}`)

    return { success: true }
  } catch (error) {
    console.error("Like toggle hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Beğeni işlemi sırasında bir hata oluştu.",
    }
  }
}

export async function toggleSave(promptId: string) {
  try {
    // Oturum kontrolü
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Kullanıcıyı Prisma'da kontrol et (yoksa oluştur)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      // Username için e-postanın '@' işaretinden önceki kısmını al ve rastgele 3 hane ekle
      const emailPrefix = user.email!.split("@")[0]
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")
      const username = `${emailPrefix}${randomSuffix}`

      // fullName için metadata'dan al, yoksa kullanıcı adını kullan
      const fullName =
        (user.user_metadata as any)?.fullName ||
        (user.user_metadata as any)?.name ||
        user.email!.split("@")[0] ||
        ""

      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          username: username,
          fullName: fullName,
        },
      })
    }

    // Mevcut kaydı kontrol et
    const existingSave = await prisma.savedPrompt.findUnique({
      where: {
        userId_promptId: {
          userId: user.id,
          promptId: promptId,
        },
      },
    })

    if (existingSave) {
      // Kaydı kaldır (Unsave)
      await prisma.savedPrompt.delete({
        where: {
          userId_promptId: {
            userId: user.id,
            promptId: promptId,
          },
        },
      })
    } else {
      // Kaydet (Save)
      await prisma.savedPrompt.create({
        data: {
          userId: user.id,
          promptId: promptId,
        },
      })
    }

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath(`/prompt/${promptId}`)

    return { success: true }
  } catch (error) {
    console.error("Save toggle hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Kaydetme işlemi sırasında bir hata oluştu.",
    }
  }
}





