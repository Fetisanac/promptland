"use client"

import { useState, useTransition } from "react"
import { logout } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { restorePrompt, permanentlyDeletePrompt } from "@/app/actions/prompt"
import { Trash2, RotateCcw, Calendar } from "lucide-react"
import Link from "next/link"

interface DeletedPrompt {
  id: string
  title: string
  deletedAt: Date | null
  _count: {
    likes: number
    comments: number
  }
}

interface SettingsPageClientProps {
  deletedPrompts: DeletedPrompt[]
}

export function SettingsPageClient({ deletedPrompts }: SettingsPageClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [localDeletedPrompts, setLocalDeletedPrompts] = useState(deletedPrompts)

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  const handleRestore = async (promptId: string) => {
    if (!confirm("Bu promptu geri yüklemek istediğinizden emin misiniz?")) {
      return
    }

    startTransition(async () => {
      const result = await restorePrompt(promptId)
      if ("error" in result) {
        alert(result.error)
      } else {
        // Listeden kaldır
        setLocalDeletedPrompts((prev) => prev.filter((p) => p.id !== promptId))
        router.refresh()
      }
    })
  }

  const handlePermanentDelete = async (promptId: string) => {
    if (
      !confirm(
        "Bu promptu kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!"
      )
    ) {
      return
    }

    startTransition(async () => {
      const result = await permanentlyDeletePrompt(promptId)
      if ("error" in result) {
        alert(result.error)
      } else {
        // Listeden kaldır
        setLocalDeletedPrompts((prev) => prev.filter((p) => p.id !== promptId))
        router.refresh()
      }
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "Bilinmiyor"
    const d = new Date(date)
    return d.toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Ayarlar
        </h1>
        <p className="text-sm text-muted-foreground">
          Hesap ayarlarını yönet ve tercihlerini düzenle.
        </p>
      </section>

      {/* Account Section */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-foreground">Hesap</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-foreground mb-4">Profil ayarlarını düzenlemek için profil sayfasını ziyaret et.</p>
            <Button
              variant="outline"
              onClick={() => router.push("/profile")}
            >
              Profili Düzenle
            </Button>
          </div>
        </div>
      </section>

      {/* Recently Deleted */}
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-foreground">
          Yakın Zamanda Silinenler
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Son 30 gün içinde silinen promptlarınız. Geri yükleyebilir veya kalıcı olarak silebilirsiniz.
        </p>
        {localDeletedPrompts.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Henüz silinen promptunuz yok.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {localDeletedPrompts.map((prompt) => (
              <div
                key={prompt.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-foreground">{prompt.title}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(prompt.deletedAt)}
                      </div>
                      <span>{prompt._count.likes} beğeni</span>
                      <span>{prompt._count.comments} yorum</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(prompt.id)}
                      disabled={isPending}
                      className="flex items-center gap-1"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Geri Yükle
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDelete(prompt.id)}
                      disabled={isPending}
                      className="flex items-center gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      Kalıcı Sil
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Danger Zone */}
      <section className="rounded-lg border border-red-500/50 bg-card p-6">
        <h2 className="mb-6 text-xl font-semibold text-red-600 dark:text-red-500">Tehlikeli Bölge</h2>
        <div className="space-y-4">
          <div>
            <p className="mb-4 text-sm text-foreground">
              Hesabından çıkış yap. Tekrar giriş yapmak için giriş sayfasını kullan.
            </p>
            <form action={handleLogout}>
              <Button type="submit" variant="destructive">
                Çıkış Yap
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}



 







