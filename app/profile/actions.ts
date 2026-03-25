'use server'

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"

type UpdateProfileInput = {
  fullName: string
  bio: string | null
  website: string | null
  avatarUrl: string | null
  coverUrl: string | null
}

export async function updateProfile(data: UpdateProfileInput) {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Giriş yapmanız gerekiyor." }
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: data.fullName,
        bio: data.bio,
        website: data.website,
        avatarUrl: data.avatarUrl,
        coverUrl: data.coverUrl,
      },
    })

    // Kullanıcının username'ini bul ve o sayfayı revalidate et
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { username: true },
    })
    if (updatedUser) {
      revalidatePath(`/profile/${updatedUser.username}`)
    }
    revalidatePath("/profile") // Eski route için de
    return { success: true }
  } catch (error: any) {
    console.error("updateProfile error:", error)
    return {
      error:
        error?.message ??
        "Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
    }
  }
}










