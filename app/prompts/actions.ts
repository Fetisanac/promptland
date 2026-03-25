"use server"

import { revalidatePath } from "next/cache"
import { createClient, createAdminClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
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
      .from("prompt-images")
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { error: `Resim yükleme hatası: ${uploadError.message}` }
    }

    // Public URL'i al
    const {
      data: { publicUrl },
    } = adminClient.storage.from("prompt-images").getPublicUrl(filePath)

    return { url: publicUrl }
  } catch (error) {
    console.error("Image upload error:", error)
    return {
      error: error instanceof Error ? error.message : "Resim yüklenirken bir hata oluştu.",
    }
  }
}

export async function uploadVideo(file: File): Promise<{ url: string } | { error: string }> {
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

    // Admin client ile yükle (RLS bypass) - prompt-videos bucket'ına
    const { error: uploadError } = await adminClient.storage
      .from("prompt-videos")
      .upload(filePath, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return { error: `Video yükleme hatası: ${uploadError.message}` }
    }

    // Public URL'i al
    const {
      data: { publicUrl },
    } = adminClient.storage.from("prompt-videos").getPublicUrl(filePath)

    return { url: publicUrl }
  } catch (error) {
    console.error("Video upload error:", error)
    return {
      error: error instanceof Error ? error.message : "Video yüklenirken bir hata oluştu.",
    }
  }
}

export async function createPrompt(formData: FormData) {
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
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const promptText = formData.get("promptText") as string
    const model = formData.get("model") as string | null
    const tagsString = formData.get("tags") as string | null
    const imageFile = formData.get("image") as File | null
    const videoFile = formData.get("video") as File | null
    const mediaType = formData.get("mediaType") as string | null // "image" veya "video"

    // Medya yükleme (resim veya video)
    let imageUrl: string | null = null
    let videoUrl: string | null = null

    if (mediaType === "image" && imageFile && imageFile.size > 0) {
      const uploadResult = await uploadImage(imageFile)
      if ("error" in uploadResult) {
        return { error: uploadResult.error }
      }
      imageUrl = uploadResult.url
    } else if (mediaType === "video" && videoFile && videoFile.size > 0) {
      const uploadResult = await uploadVideo(videoFile)
      if ("error" in uploadResult) {
        return { error: uploadResult.error }
      }
      videoUrl = uploadResult.url
    }

    // Validasyon
    if (!title || !promptText) {
      return { error: "Başlık ve prompt metni zorunludur." }
    }

    // Tags'i string'den array'e çevir
    const tags = tagsString
      ? tagsString
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : []

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

    // Prompt'u oluştur
    await prisma.prompt.create({
      data: {
        title,
        description: description || null,
        promptText,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        model: model || null,
        tags,
        userId: user.id,
      },
    })

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath("/explore")

    return { success: true }
  } catch (error) {
    console.error("Prompt oluşturma hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Prompt oluşturulurken bir hata oluştu.",
    }
  }
}

