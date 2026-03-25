"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

async function uploadCommentImage(file: File): Promise<{ url: string } | { error: string }> {
  try {
    // Önce kullanıcının authenticated olduğunu kontrol et
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Service role key ile admin client oluştur (RLS bypass)
    const adminClient = createAdminClient()

    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = fileName

    // File'ı ArrayBuffer'a çevir
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Admin client ile yükle (RLS bypass)
    const { error: uploadError } = await adminClient.storage
      .from("comment-images")
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Comment image upload error:", uploadError)
      return { error: `Resim yükleme hatası: ${uploadError.message}` }
    }

    // Public URL'i al
    const {
      data: { publicUrl },
    } = adminClient.storage.from("comment-images").getPublicUrl(filePath)

    return { url: publicUrl }
  } catch (error) {
    console.error("Comment image upload error:", error)
    return {
      error: error instanceof Error ? error.message : "Resim yüklenirken bir hata oluştu.",
    }
  }
}

export async function createComment(formData: FormData) {
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

    // Form verilerini al
    const promptId = formData.get("promptId") as string
    const content = formData.get("content") as string
    const imageFile = formData.get("image") as File | null

    // Validasyon
    if (!promptId || !content || content.trim().length === 0) {
      return { error: "Yorum metni zorunludur." }
    }

    // Resim yükleme (eğer varsa)
    let imageUrl: string | null = null
    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadCommentImage(imageFile)
      if ("error" in uploadResult) {
        return { error: uploadResult.error }
      }
      imageUrl = uploadResult.url
    }

    // Kullanıcıyı Prisma'da kontrol et (yoksa oluştur)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          username:
            (user.user_metadata as any)?.username ||
            user.email!.split("@")[0],
          fullName: (user.user_metadata as any)?.fullName || "",
        },
      })
    }

    // Yorumu oluştur
    await prisma.comment.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        userId: user.id,
        promptId: promptId,
      },
    })

    // Post sahibini bul ve bildirim oluştur (kendi postuna yorum yaparsa bildirim oluşturma)
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
          type: "COMMENT",
        },
      })
      revalidatePath("/notifications")
    }

    // Cache'i temizle
    revalidatePath(`/prompt/${promptId}`)

    return { success: true }
  } catch (error) {
    console.error("Comment oluşturma hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Yorum oluşturulurken bir hata oluştu.",
    }
  }
}

export async function toggleCommentLike(commentId: string) {
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

    // Mevcut beğeniyi kontrol et
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId: commentId,
        },
      },
    })

    if (existingLike) {
      // Beğeniyi kaldır (Unlike)
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: user.id,
            commentId: commentId,
          },
        },
      })
    } else {
      // Beğeniyi ekle (Like)
      await prisma.commentLike.create({
        data: {
          userId: user.id,
          commentId: commentId,
        },
      })
    }

    // Comment'in promptId'sini bul
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { promptId: true },
    })

    if (comment) {
      // Cache'i temizle
      revalidatePath(`/prompt/${comment.promptId}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Comment like toggle hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Beğeni işlemi sırasında bir hata oluştu.",
    }
  }
}





