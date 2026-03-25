"use client"

import { useState, useTransition } from "react"
import { toggleFollow } from "@/app/actions/user"
import { Button } from "@/components/ui/button"

interface FollowButtonProps {
  targetUserId: string
  initialIsFollowing: boolean
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isPending, startTransition] = useTransition()

  const handleToggleFollow = () => {
    // Optimistic update
    setIsFollowing(!isFollowing)

    startTransition(async () => {
      const result = await toggleFollow(targetUserId)

      if (result.error) {
        // Hata durumunda geri al
        setIsFollowing(isFollowing)
        alert(result.error)
      }
    })
  }

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isPending}
      variant={isFollowing ? "outline" : "default"}
      size="md"
      className={
        isFollowing
          ? "border-slate-600 text-slate-300 hover:bg-slate-800"
          : "bg-sky-500 text-white hover:bg-sky-400"
      }
    >
      {isFollowing ? "Takibi Bırak" : "Takip Et"}
    </Button>
  )
}







