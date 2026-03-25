"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { ImageIcon, X, Send } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createComment } from "@/app/actions/comment"
import { useRouter } from "next/navigation"

interface CommentInputProps {
  promptId: string
}

export function CommentInput({ promptId }: CommentInputProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Önizleme oluştur
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
      setError(null)
    }
  }

  const handleRemoveImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("promptId", promptId)
      formData.append("content", content)
      if (selectedFile) {
        formData.append("image", selectedFile)
      }

      const result = await createComment(formData)

      if (result.error) {
        setError(result.error)
      } else {
        // Başarılı - formu temizle
        setContent("")
        handleRemoveImage()
        router.refresh()
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Yorumunuzu yazın..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] resize-none bg-slate-900/60 border-slate-800 text-slate-100 placeholder:text-slate-500"
          required
        />

        {/* Resim Önizleme */}
        {imagePreview && (
          <div className="relative w-full max-w-xs rounded-lg overflow-hidden border border-slate-700">
            <Image
              src={imagePreview}
              alt="Yorum önizleme"
              width={300}
              height={200}
              className="w-full h-auto object-cover"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>

      {/* Araç Çubuğu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-slate-400 hover:text-slate-200"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Resim Ekle
          </Button>
        </div>

        <Button
          type="submit"
          disabled={loading || !content.trim()}
          className="bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-50"
        >
          {loading ? (
            "Gönderiliyor..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Gönder
            </>
          )}
        </Button>
      </div>
    </form>
  )
}











