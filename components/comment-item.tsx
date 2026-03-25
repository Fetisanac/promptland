"use client"

import Image from "next/image"
import { useState, useTransition } from "react"
import { Heart, X } from "lucide-react"
import { toggleCommentLike } from "@/app/actions/comment"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CommentItemProps {
  comment: {
    id: string
    content: string
    imageUrl: string | null
    createdAt: Date
    user: {
      username: string
      avatarUrl: string | null
    }
    isLiked: boolean
    _count: {
      commentLikes: number
    }
  }
}

export function CommentItem({ comment }: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.isLiked)
  const [likeCount, setLikeCount] = useState(comment._count.commentLikes)
  const [isPending, startTransition] = useTransition()
  const [imageDialogOpen, setImageDialogOpen] = useState(false)

  const handleLike = () => {
    // Optimistic UI update
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1))

    // Server action'ı çağır
    startTransition(async () => {
      const result = await toggleCommentLike(comment.id)
      if (result.error) {
        // Hata durumunda geri al
        setIsLiked(!newIsLiked)
        setLikeCount((prev) => (newIsLiked ? prev - 1 : prev + 1))
      }
    })
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Az önce"
    if (minutes < 60) return `${minutes} dakika önce`
    if (hours < 24) return `${hours} saat önce`
    if (days < 7) return `${days} gün önce`
    return new Date(date).toLocaleDateString("tr-TR")
  }

  return (
    <>
      <div className="flex gap-4 p-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user.avatarUrl ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-full">
              <Image
                src={comment.user.avatarUrl}
                alt={comment.user.username}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
              {comment.user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              @{comment.user.username}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {comment.content}
          </p>

          {/* Yorum Görseli */}
          {comment.imageUrl && (
            <div
              className="relative w-full max-w-md cursor-pointer rounded-md overflow-hidden border border-border"
              onClick={() => setImageDialogOpen(true)}
            >
              <Image
                src={comment.imageUrl}
                alt="Yorum görseli"
                width={400}
                height={300}
                className="w-full h-auto max-h-60 object-cover"
                unoptimized={comment.imageUrl.startsWith("http")}
              />
            </div>
          )}

          {/* Alt Bar - Beğeni */}
          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={handleLike}
              disabled={isPending}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <Heart
                className={`h-4 w-4 transition-all ${
                  isLiked ? "fill-red-500 text-red-500" : ""
                }`}
              />
              <span className="text-xs">{likeCount}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Görsel Dialog */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-4xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Yorum Görseli</DialogTitle>
          </DialogHeader>
          {comment.imageUrl && (
            <div className="relative w-full aspect-video">
              <Image
                src={comment.imageUrl}
                alt="Yorum görseli"
                fill
                className="object-contain rounded-lg"
                unoptimized={comment.imageUrl.startsWith("http")}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}









