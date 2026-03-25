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

export async function updatePrompt(formData: FormData) {
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
    const promptId = formData.get("id") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string | null
    const promptText = formData.get("promptText") as string
    const model = formData.get("model") as string | null
    const tagsString = formData.get("tags") as string | null
    const imageFile = formData.get("image") as File | null
    const videoFile = formData.get("video") as File | null
    const mediaType = formData.get("mediaType") as string | null
    const existingImageUrl = formData.get("existingImageUrl") as string | null
    const existingVideoUrl = formData.get("existingVideoUrl") as string | null
    const removeMedia = formData.get("removeMedia") as string | null

    // Validasyon
    if (!promptId || !title || !promptText) {
      return { error: "Başlık ve prompt metni zorunludur." }
    }

    // Prompt'un var olduğunu ve sahibinin kontrolü
    const existingPrompt = await prisma.prompt.findUnique({
      where: { id: promptId },
      select: { userId: true, imageUrl: true, videoUrl: true },
    })

    if (!existingPrompt) {
      return { error: "Prompt bulunamadı." }
    }

    // Güvenlik: Sadece prompt sahibi düzenleyebilir
    if (existingPrompt.userId !== user.id) {
      return { error: "Bu promptu düzenleme yetkiniz yok." }
    }

    // Medya yükleme/güncelleme mantığı
    let imageUrl: string | null = existingImageUrl || existingPrompt.imageUrl
    let videoUrl: string | null = existingVideoUrl || existingPrompt.videoUrl

    // Medya kaldırıldıysa
    if (removeMedia === "true") {
      imageUrl = null
      videoUrl = null
    } else if (mediaType === "image" && imageFile && imageFile.size > 0) {
      // Yeni resim yüklendi
      const uploadResult = await uploadImage(imageFile)
      if ("error" in uploadResult) {
        return { error: uploadResult.error }
      }
      imageUrl = uploadResult.url
      videoUrl = null // Resim yüklendiğinde video'yu temizle
    } else if (mediaType === "video" && videoFile && videoFile.size > 0) {
      // Yeni video yüklendi
      const uploadResult = await uploadVideo(videoFile)
      if ("error" in uploadResult) {
        return { error: uploadResult.error }
      }
      videoUrl = uploadResult.url
      imageUrl = null // Video yüklendiğinde resmi temizle
    }

    // Tags'i string'den array'e çevir
    const tags = tagsString
      ? tagsString
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
      : []

    // Prompt'u güncelle
    await prisma.prompt.update({
      where: { id: promptId },
      data: {
        title,
        description: description || null,
        promptText,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        model: model || null,
        tags,
      },
    })

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath("/explore")
    revalidatePath(`/prompt/${promptId}`)

    return { success: true }
  } catch (error) {
    console.error("Prompt güncelleme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Prompt güncellenirken bir hata oluştu.",
    }
  }
}

// Soft Delete: Prompt'u silmek yerine deletedAt alanına tarih atar
export async function softDeletePrompt(id: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Prompt'un var olduğunu ve sahibinin kontrolü
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { userId: true, deletedAt: true },
    })

    if (!prompt) {
      return { error: "Prompt bulunamadı." }
    }

    // Güvenlik: Sadece prompt sahibi silebilir
    if (prompt.userId !== user.id) {
      return { error: "Bu promptu silme yetkiniz yok." }
    }

    // Zaten silinmişse
    if (prompt.deletedAt) {
      return { error: "Bu prompt zaten silinmiş." }
    }

    // Soft delete: deletedAt alanına şu anki tarihi ata
    await prisma.prompt.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath("/explore")
    revalidatePath(`/prompt/${id}`)
    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("Prompt silme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Prompt silinirken bir hata oluştu.",
    }
  }
}

// Restore: Silinmiş prompt'u geri yükler (deletedAt'i null yapar)
export async function restorePrompt(id: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Prompt'un var olduğunu ve sahibinin kontrolü
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { userId: true, deletedAt: true },
    })

    if (!prompt) {
      return { error: "Prompt bulunamadı." }
    }

    // Güvenlik: Sadece prompt sahibi geri yükleyebilir
    if (prompt.userId !== user.id) {
      return { error: "Bu promptu geri yükleme yetkiniz yok." }
    }

    // Zaten geri yüklenmişse
    if (!prompt.deletedAt) {
      return { error: "Bu prompt zaten aktif." }
    }

    // Restore: deletedAt'i null yap
    await prisma.prompt.update({
      where: { id },
      data: { deletedAt: null },
    })

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath("/explore")
    revalidatePath(`/prompt/${id}`)
    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("Prompt geri yükleme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Prompt geri yüklenirken bir hata oluştu.",
    }
  }
}

// Permanent Delete: Prompt'u veritabanından tamamen siler
export async function permanentlyDeletePrompt(id: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Prompt'un var olduğunu ve sahibinin kontrolü
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { userId: true, deletedAt: true, imageUrl: true, videoUrl: true },
    })

    if (!prompt) {
      return { error: "Prompt bulunamadı." }
    }

    // Güvenlik: Sadece prompt sahibi kalıcı olarak silebilir
    if (prompt.userId !== user.id) {
      return { error: "Bu promptu silme yetkiniz yok." }
    }

    // Önce silinmiş olmalı (güvenlik için)
    if (!prompt.deletedAt) {
      return { error: "Önce promptu silmeniz gerekiyor." }
    }

    // Storage'dan medya dosyalarını sil (opsiyonel - şimdilik sadece veritabanından siliyoruz)
    // TODO: Supabase Storage'dan da silme işlemi eklenebilir

    // Veritabanından tamamen sil (Cascade ile ilişkili kayıtlar da silinir)
    await prisma.prompt.delete({
      where: { id },
    })

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath("/explore")
    revalidatePath("/settings")

    return { success: true }
  } catch (error) {
    console.error("Prompt kalıcı silme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Prompt kalıcı olarak silinirken bir hata oluştu.",
    }
  }
}

// Report: Prompt'u bildir
export async function reportPrompt(id: string, reason: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Validasyon
    if (!reason || reason.trim().length === 0) {
      return { error: "Bildirim nedeni gereklidir." }
    }

    // Prompt'un var olduğunu kontrol et
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    })

    if (!prompt) {
      return { error: "Prompt bulunamadı." }
    }

    // Silinmiş prompt bildirilemez
    if (prompt.deletedAt) {
      return { error: "Bu prompt silinmiş." }
    }

    // Kullanıcı kendi promptunu bildiremez
    const promptWithUser = await prisma.prompt.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (promptWithUser?.userId === user.id) {
      return { error: "Kendi promptunuzu bildiremezsiniz." }
    }

    // Aynı kullanıcı aynı promptu daha önce bildirmiş mi kontrol et
    const existingReport = await prisma.report.findFirst({
      where: {
        userId: user.id,
        promptId: id,
        status: "PENDING",
      },
    })

    if (existingReport) {
      return { error: "Bu promptu zaten bildirdiniz." }
    }

    // Bildirimi oluştur
    await prisma.report.create({
      data: {
        userId: user.id,
        promptId: id,
        reason: reason.trim(),
        status: "PENDING",
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Prompt bildirme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Prompt bildirilirken bir hata oluştu.",
    }
  }
}

// Kullanıcının son 30 gün içinde silinmiş promptlarını getir
export async function getRecentlyDeletedPrompts() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // 30 gün öncesinin tarihini hesapla
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Kullanıcının son 30 gün içinde silinmiş promptlarını getir
    const deletedPrompts = await prisma.prompt.findMany({
      where: {
        userId: user.id,
        deletedAt: {
          not: null,
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        deletedAt: "desc",
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    return { prompts: deletedPrompts }
  } catch (error) {
    console.error("Silinmiş promptları getirme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Silinmiş promptlar getirilirken bir hata oluştu.",
    }
  }
}


