"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { MessageCircle, Share2, Pencil, MoreVertical, Trash2, Flag } from "lucide-react"
import { LikeButton } from "@/components/like-button"
import { BookmarkButton } from "@/components/bookmark-button"
import { EditPromptDialog } from "@/components/edit-prompt-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { softDeletePrompt, reportPrompt } from "@/app/actions/prompt"

interface FeedCardProps {
  prompt: {
    id: string
    title: string
    description: string | null
    promptText: string
    imageUrl: string | null
    videoUrl?: string | null
    model: string | null
    tags?: string[]
    user: {
      id?: string
      username: string
    }
    userId?: string
    isLiked?: boolean
    isSaved?: boolean
    _count?: {
      likes: number
      comments: number
    }
  }
  currentUserId?: string | null
}

export function FeedCard({ prompt, currentUserId }: FeedCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const commentCount = prompt._count?.comments || 0
  const likeCount = prompt._count?.likes || 0
  const isLiked = prompt.isLiked ?? false
  
  // Prompt sahibi kontrolü
  const promptUserId = prompt.userId || prompt.user.id
  const isOwner = currentUserId && promptUserId && currentUserId === promptUserId

  // Debug: Eğer prompt verisi eksikse hata göster
  if (!prompt || !prompt.id) {
    return (
      <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-red-400">
        Hata: Prompt verisi eksik
      </div>
    )
  }

  const handleCardClick = () => {
    router.push(`/prompt/${prompt.id}`)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Paylaşma işlevi
    if (navigator.share) {
      navigator.share({
        title: prompt.title,
        text: prompt.description || prompt.promptText,
        url: `${window.location.origin}/prompt/${prompt.id}`,
      })
    } else {
      // Fallback: URL'yi kopyala
      navigator.clipboard.writeText(
        `${window.location.origin}/prompt/${prompt.id}`,
      )
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm("Bu promptu silmek istediğinizden emin misiniz? Geri yükleyebilirsiniz.")) {
      return
    }

    startTransition(async () => {
      const result = await softDeletePrompt(prompt.id)
      if ("error" in result) {
        alert(result.error)
      } else {
        router.refresh()
      }
    })
  }

  const handleReport = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const reason = window.prompt("Bu promptu neden bildirmek istiyorsunuz?")
    if (!reason || reason.trim().length === 0) {
      return
    }

    startTransition(async () => {
      const result = await reportPrompt(prompt.id, reason)
      if ("error" in result) {
        alert(result.error)
      } else {
        alert("Bildiriminiz alındı. Teşekkür ederiz.")
      }
    })
  }

  return (
    <article
      onClick={handleCardClick}
      className="flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:border-foreground/20 transition-colors cursor-pointer"
    >
      {/* Medya Alanı - Edge-to-edge (kenarlara tam oturur) */}
      {prompt.videoUrl ? (
        <div className="relative w-full overflow-hidden">
          <video
            src={prompt.videoUrl}
            controls
            className="w-full h-64 object-cover md:h-80"
          />
        </div>
      ) : prompt.imageUrl ? (
        <div className="relative w-full overflow-hidden">
          <Image
            src={prompt.imageUrl}
            alt={prompt.title}
            width={800}
            height={450}
            className="w-full h-64 object-cover md:h-80"
            unoptimized={prompt.imageUrl.startsWith("http")}
            priority={false}
          />
        </div>
      ) : null}

      {/* İçerik Alanı - Ferah whitespace */}
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
            {prompt.model || "Model"}
          </div>
          <div className="flex items-center gap-3">
            {isOwner && (
              <EditPromptDialog
                prompt={{
                  id: prompt.id,
                  title: prompt.title,
                  description: prompt.description,
                  promptText: prompt.promptText,
                  imageUrl: prompt.imageUrl,
                  model: prompt.model,
                  tags: prompt.tags || [],
                }}
              >
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Düzenle"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </EditPromptDialog>
            )}
            <Link
              href={`/profile/${prompt.user.username}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              @{prompt.user.username}
            </Link>
            {currentUserId && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  {isOwner ? (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={isPending}
                      className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={handleReport}
                      disabled={isPending}
                      className="text-foreground"
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Bildir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold leading-tight text-foreground">{prompt.title}</h2>
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {prompt.description || prompt.promptText}
          </p>
        </div>

        {/* Alt Bar - Interactions */}
        <div
          className="flex items-center gap-6 pt-2 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <LikeButton
            promptId={prompt.id}
            initialIsLiked={isLiked}
            initialLikeCount={likeCount}
          />

          <Link
            href={`/prompt/${prompt.id}#comments`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm font-medium">{commentCount}</span>
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <BookmarkButton
            promptId={prompt.id}
            initialIsSaved={prompt.isSaved}
          />
        </div>
      </div>
    </article>
  )
}

