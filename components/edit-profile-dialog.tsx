"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Camera, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { updateProfile } from "@/app/profile/actions"
import { createClient as createSupabaseClient } from "@/utils/supabase/client"

type EditProfileUser = {
  id: string
  username: string
  fullName: string | null
  bio: string | null
  website: string | null
  avatarUrl: string | null
  coverUrl: string | null
}

interface EditProfileDialogProps {
  user: EditProfileUser
}

export function EditProfileDialog({ user }: EditProfileDialogProps) {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatarUrl || null,
  )
  const [coverPreview, setCoverPreview] = useState<string | null>(
    user.coverUrl || null,
  )

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview)
      }
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  }, [avatarPreview, coverPreview])

  const handleAvatarChange = useCallback(
    (file: File | null) => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview)
      }
      setAvatarFile(file)
      if (file) {
        setAvatarPreview(URL.createObjectURL(file))
      } else {
        setAvatarPreview(user.avatarUrl || null)
      }
    },
    [avatarPreview, user.avatarUrl],
  )

  const handleCoverChange = useCallback(
    (file: File | null) => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview)
      }
      setCoverFile(file)
      if (file) {
        setCoverPreview(URL.createObjectURL(file))
      } else {
        setCoverPreview(user.coverUrl || null)
      }
    },
    [coverPreview, user.coverUrl],
  )

  const uploadImage = async (
    bucket: "avatars" | "covers",
    file: File,
  ): Promise<string> => {
    const ext = file.name.split(".").pop() || "png"
    const path = `${user.id}/${bucket}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const fullName = (formData.get("fullName") as string) || ""
    const bio = ((formData.get("bio") as string) || "").trim() || null
    const website = ((formData.get("website") as string) || "").trim() || null

    try {
      let avatarUrl = user.avatarUrl || null
      let coverUrl = user.coverUrl || null

      if (avatarFile) {
        avatarUrl = await uploadImage("avatars", avatarFile)
      }
      if (coverFile) {
        coverUrl = await uploadImage("covers", coverFile)
      }

      const result = await updateProfile({
        fullName,
        bio,
        website,
        avatarUrl,
        coverUrl,
      })

      if (result && "error" in result && result.error) {
        setError(result.error)
        setIsSubmitting(false)
        return
      }

      setOpen(false)
      router.refresh()
    } catch (err: any) {
      console.error("EditProfileDialog submit error:", err)
      setError(
        err?.message ||
          "Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.",
      )
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Profili Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Profili Düzenle</DialogTitle>
            <DialogDescription>
              Profil bilgilerinizi ve görsellerinizi güncelleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {error && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Cover + Avatar alanı */}
            <div className="space-y-3">
              <div className="relative h-40 w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-800/60 to-slate-900/80">
                {coverPreview && (
                  <Image
                    src={coverPreview}
                    alt="Kapak fotoğrafı"
                    fill
                    className="object-cover"
                  />
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
                  <label className="flex cursor-pointer items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-medium text-slate-100 shadow-lg">
                    <Camera className="h-4 w-4" />
                    Kapak Fotoğrafını Değiştir
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={(e) =>
                        handleCoverChange(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>

                <div className="absolute -bottom-10 left-6 flex items-center gap-3">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-black/70 bg-slate-800">
                    {avatarPreview && (
                      <Image
                        src={avatarPreview}
                        alt="Avatar"
                        fill
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                      <label className="flex cursor-pointer items-center gap-1 rounded-full bg-black/80 px-3 py-1 text-[10px] font-medium text-slate-100">
                        <Camera className="h-3 w-3" />
                        Fotoğrafı Değiştir
                        <input
                          type="file"
                          accept="image/png, image/jpeg, image/webp"
                          className="hidden"
                          onChange={(e) =>
                            handleAvatarChange(e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metin alanları */}
            <div className="grid gap-4 pt-4">
              <div className="grid gap-2">
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-slate-200"
                >
                  İsim
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={user.fullName || ""}
                  placeholder="Adınız Soyadınız"
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="bio"
                  className="text-sm font-medium text-slate-200"
                >
                  Biyografi
                </label>
                <Textarea
                  id="bio"
                  name="bio"
                  defaultValue={user.bio || ""}
                  placeholder="Kendinizden ve ürettiğiniz içeriklerden bahsedin..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>

              <div className="grid gap-2">
                <label
                  htmlFor="website"
                  className="text-sm font-medium text-slate-200"
                >
                  Website
                </label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  defaultValue={user.website || ""}
                  placeholder="https://"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Yükleniyor..." : "Değişiklikleri Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}




















