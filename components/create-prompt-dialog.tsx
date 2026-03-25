"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { createPrompt } from "@/app/prompts/actions"
import { useRouter } from "next/navigation"

interface CreatePromptDialogProps {
  children: React.ReactNode
}

export function CreatePromptDialog({ children }: CreatePromptDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<"image" | "video" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Dosya türünü belirle
      if (file.type.startsWith("image/")) {
        setFileType("image")
      } else if (file.type.startsWith("video/")) {
        setFileType("video")
      } else {
        setFileType(null)
        setError("Lütfen geçerli bir resim veya video dosyası seçin.")
        return
      }
      
      // Önizleme oluştur
      const previewUrl = URL.createObjectURL(file)
      setPreviewUrl(previewUrl)
      setError(null)
    }
  }

  const handleRemoveMedia = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setFileType(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      
      // Medya dosyasını FormData'ya ekle (eğer seçildiyse)
      if (selectedFile && fileType) {
        if (fileType === "image") {
          formData.append("image", selectedFile)
        } else if (fileType === "video") {
          formData.append("video", selectedFile)
        }
        formData.append("mediaType", fileType)
      }

      // Server action'ı çağır (medya yükleme server-side'da yapılacak)
      const result = await createPrompt(formData)

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // 4. Başarılı - Dialog'u kapat ve formu temizle
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setSelectedFile(null)
      setFileType(null)
      setOpen(false)
      setError(null)
      
      // Formu sıfırla
      e.currentTarget.reset()
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Sayfayı yenile
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bir hata oluştu. Lütfen tekrar deneyin."
      )
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open && !loading) {
      // Dialog kapanırken temizlik yap
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
      setSelectedFile(null)
      setFileType(null)
      setError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
    setOpen(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Yeni Prompt Oluştur
          </DialogTitle>
          <DialogDescription>
            AI promptunu paylaş ve toplulukla buluştur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Medya Yükleme Alanı */}
          <div className="space-y-2">
            <Label htmlFor="media">Görsel veya Video Yükle (Opsiyonel)</Label>
            <Input
              ref={fileInputRef}
              id="media"
              name="media"
              type="file"
              accept="image/*,video/mp4,video/webm,video/quicktime"
              onChange={handleFileChange}
              disabled={loading}
              className="cursor-pointer"
            />
            {previewUrl && fileType === "image" && (
              <div className="relative mt-2 rounded-lg overflow-hidden border border-white/20 bg-white/5">
                <div className="relative aspect-video w-full">
                  <Image
                    src={previewUrl}
                    alt="Önizleme"
                    fill
                    className="object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2"
                  disabled={loading}
                >
                  Kaldır
                </Button>
              </div>
            )}
            {previewUrl && fileType === "video" && (
              <div className="relative mt-2 rounded-lg overflow-hidden border border-white/20 bg-white/5">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-48 rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2"
                  disabled={loading}
                >
                  Kaldır
                </Button>
              </div>
            )}
          </div>

          {/* Başlık */}
          <div className="space-y-2">
            <Label htmlFor="title">Başlık *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Prompt başlığı..."
              required
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
            />
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              name="model"
              placeholder="Midjourney, DALL-E, Stable Diffusion, ChatGPT, etc."
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
            />
          </div>

          {/* Prompt Metni */}
          <div className="space-y-2">
            <Label htmlFor="promptText">Prompt Metni *</Label>
            <Textarea
              id="promptText"
              name="promptText"
              placeholder="AI promptunuzu buraya yazın..."
              rows={8}
              required
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Açıklama */}
          <div className="space-y-2">
            <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Prompt hakkında kısa bir açıklama..."
              rows={3}
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Etiketler */}
          <div className="space-y-2">
            <Label htmlFor="tags">Etiketler (virgülle ayırın)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="art, design, ai, photography"
              disabled={loading}
              className="bg-white/5 border-white/20 text-white placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-400">
              Örnek: art, design, ai, photography, landscape
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={loading}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white hover:from-fuchsia-400 hover:via-violet-400 hover:to-cyan-400 shadow-lg shadow-fuchsia-500/30"
            >
              {loading ? "Yükleniyor..." : "Paylaş"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

