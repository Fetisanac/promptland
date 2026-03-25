import { prisma } from "./prisma"

/**
 * Supabase Storage RLS politikalarını ayarlar
 * Bu scripti bir kez çalıştırarak storage bucket'larını ve politikalarını oluşturur
 * 
 * Çalıştırma: npx tsx lib/fix-storage.ts
 */
export async function fixStoragePolicies() {
  try {
    console.log("🔄 Storage bucket'ları ve politikaları ayarlanıyor...")

    // Buckets oluştur
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('avatars', 'avatars', true) 
      ON CONFLICT (id) DO NOTHING;
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('covers', 'covers', true) 
      ON CONFLICT (id) DO NOTHING;
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('prompt-images', 'prompt-images', true) 
      ON CONFLICT (id) DO NOTHING;
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('comment-images', 'comment-images', true) 
      ON CONFLICT (id) DO NOTHING;
    `)

    console.log("✅ Bucket'lar oluşturuldu")

    // Eski politikaları sil (her birini ayrı ayrı)
    const policiesToDrop = [
      "Public Access",
      "Auth Upload",
      "Owner Update",
      "Public Read",
      "Authenticated Upload",
      "Owner Delete",
    ]

    for (const policyName of policiesToDrop) {
      try {
        await prisma.$executeRawUnsafe(
          `DROP POLICY IF EXISTS "${policyName}" ON storage.objects`
        )
      } catch (error: any) {
        // Policy yoksa veya başka bir hata varsa devam et
        if (error?.code !== "P2010" && error?.meta?.code !== "42P01") {
          console.log(`Policy "${policyName}" silinirken hata:`, error.message)
        }
      }
    }

    console.log("✅ Eski politikalar temizlendi")

    // Yeni politikaları oluştur
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Access" 
      ON storage.objects 
      FOR SELECT 
      USING ( bucket_id IN ('avatars', 'covers', 'prompt-images', 'comment-images') );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Auth Upload" 
      ON storage.objects 
      FOR INSERT 
      WITH CHECK ( auth.role() = 'authenticated' AND bucket_id IN ('avatars', 'covers', 'prompt-images', 'comment-images') );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Owner Update" 
      ON storage.objects 
      FOR UPDATE 
      USING ( auth.uid() = owner AND bucket_id IN ('avatars', 'covers', 'prompt-images', 'comment-images') );
    `)

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Owner Delete" 
      ON storage.objects 
      FOR DELETE 
      USING ( auth.uid() = owner AND bucket_id IN ('avatars', 'covers', 'prompt-images', 'comment-images') );
    `)

    console.log("✅ Yeni politikalar oluşturuldu")
    console.log("🎉 Storage RLS ayarları tamamlandı!")

    return { success: true }
  } catch (error) {
    console.error("❌ Hata:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Bilinmeyen hata" 
    }
  } finally {
    await prisma.$disconnect()
  }
}

// Script olarak çalıştırılırsa
if (require.main === module) {
  fixStoragePolicies()
    .then((result) => {
      if (result.success) {
        process.exit(0)
      } else {
        console.error("Hata:", result.error)
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error("Beklenmeyen hata:", error)
      process.exit(1)
    })
}

