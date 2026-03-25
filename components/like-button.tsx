"use client"

import { Heart } from "lucide-react"
import { useState, useTransition } from "react"
import { toggleLike } from "@/app/actions/social"

interface LikeButtonProps {
  promptId: string
  initialIsLiked: boolean
  initialLikeCount: number
}

export function LikeButton({
  promptId,
  initialIsLiked,
  initialLikeCount,
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [likeCount, setLikeCount] = useState(initialLikeCount)
  const [isPending, startTransition] = useTransition()

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic UI update
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1))

    // Server action'ı çağır
    startTransition(async () => {
      const result = await toggleLike(promptId)
      if (result.error) {
        // Hata durumunda geri al
        setIsLiked(!newIsLiked)
        setLikeCount((prev) => (newIsLiked ? prev - 1 : prev + 1))
      }
    })
  }

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className="flex items-center gap-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      <Heart
        className={`h-5 w-5 transition-all ${
          isLiked ? "fill-red-500 text-red-500" : ""
        }`}
      />
      <span className="text-sm">{likeCount}</span>
    </button>
  )
}











