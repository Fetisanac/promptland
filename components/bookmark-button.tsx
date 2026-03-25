"use client"

import { useState, useTransition } from "react"
import { Bookmark } from "lucide-react"
import { toggleSave } from "@/app/actions/social"
import { cn } from "@/lib/utils"

interface BookmarkButtonProps {
  promptId: string
  initialIsSaved?: boolean
}

export function BookmarkButton({
  promptId,
  initialIsSaved = false,
}: BookmarkButtonProps) {
  const [isSaved, setIsSaved] = useState(initialIsSaved)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Optimistic update
    setIsSaved(!isSaved)

    startTransition(async () => {
      const result = await toggleSave(promptId)
      if (result.error) {
        // Hata durumunda geri al
        setIsSaved(isSaved)
        alert(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "flex items-center gap-2 transition-colors",
        isSaved
          ? "text-yellow-500 hover:text-yellow-400"
          : "text-slate-400 hover:text-yellow-500",
      )}
    >
      <Bookmark
        className={cn("h-5 w-5", isSaved && "fill-current")}
      />
    </button>
  )
}







