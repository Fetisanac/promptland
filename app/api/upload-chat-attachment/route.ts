import { NextRequest, NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/utils/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: "Oturum açmanız gerekiyor." },
        { status: 401 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const conversationId = formData.get("conversationId") as string

    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı." },
        { status: 400 },
      )
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID gerekli." },
        { status: 400 },
      )
    }

    // Dosya tipini kontrol et
    const fileType = file.type
    const isImage = fileType.startsWith("image/")

    if (!isImage) {
      return NextResponse.json(
        { error: "Sadece resim dosyaları destekleniyor." },
        { status: 400 },
      )
    }

    // Dosya boyutunu kontrol et (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Dosya boyutu 10MB'dan küçük olmalıdır." },
        { status: 400 },
      )
    }

    // Service role key ile admin client oluştur (RLS bypass)
    const adminClient = createAdminClient()

    // Dosya adını oluştur (unique olması için timestamp ekle)
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop()
    const fileName = `${conversationId}/${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExtension}`

    // File'ı ArrayBuffer'a çevir
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Admin client ile yükle (RLS bypass)
    const { data, error } = await adminClient.storage
      .from("chat-attachments")
      .upload(fileName, buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      })

    if (error) {
      console.error("Storage upload error:", error)
      
      // Daha açıklayıcı hata mesajları
      let errorMessage = "Dosya yüklenirken bir hata oluştu."
      
      if (error.message?.includes("Bucket not found") || error.message?.includes("not found")) {
        errorMessage = "Storage bucket bulunamadı. Lütfen Supabase Dashboard'da 'chat-attachments' bucket'ını oluşturun."
      } else if (error.message?.includes("new row violates row-level security")) {
        errorMessage = "Storage erişim izni hatası. Bucket politikalarını kontrol edin."
      } else if (error.message) {
        errorMessage = `Yükleme hatası: ${error.message}`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 },
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: "Dosya yüklendi ancak veri alınamadı." },
        { status: 500 },
      )
    }

    // Public URL'i al
    const {
      data: { publicUrl },
    } = adminClient.storage.from("chat-attachments").getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Beklenmeyen hata: ${error.message}`
            : "Dosya yüklenirken bir hata oluştu.",
      },
      { status: 500 },
    )
  }
}
