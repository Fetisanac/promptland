"use client"

import { useState, useTransition } from "react"
import { toggleFollow } from "@/app/actions/user"
import { Button } from "@/components/ui/button"

interface FollowButtonSmallProps {
  targetUserId: string
  initialIsFollowing: boolean
}

export function FollowButtonSmall({
  targetUserId,
  initialIsFollowing,
}: FollowButtonSmallProps) {
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
      size="sm"
      className="text-xs px-2 py-1 h-auto"
    >
      {isFollowing ? "Takibi Bırak" : "Takip Et"}
    </Button>
  )
}




