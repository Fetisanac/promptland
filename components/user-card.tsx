"use client"

import Image from "next/image"
import Link from "next/link"
import { FollowButtonSmall } from "@/components/follow-button-small"

interface UserCardProps {
  user: {
    id: string
    username: string
    fullName: string
    avatarUrl: string | null
    bio: string | null
    promptCount: number
    followerCount: number
  }
  currentUserId?: string | null
  isFollowing?: boolean
}

export function UserCard({ user, currentUserId, isFollowing = false }: UserCardProps) {
  const isOwner = currentUserId === user.id

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-foreground/20 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user.avatarUrl ? (
          <Link href={`/profile/${user.username}`}>
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              <Image
                src={user.avatarUrl}
                alt={user.username}
                fill
                className="object-cover"
              />
            </div>
          </Link>
        ) : (
          <Link href={`/profile/${user.username}`}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
              {(user.fullName || user.username).charAt(0).toUpperCase()}
            </div>
          </Link>
        )}
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.username}`}>
          <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
            {user.fullName || user.username}
          </h3>
          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          {user.bio && (
            <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
              {user.bio}
            </p>
          )}
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{user.promptCount} gönderi</span>
            <span>{user.followerCount} takipçi</span>
          </div>
        </Link>
      </div>

      {/* Takip Butonu */}
      {!isOwner && currentUserId && (
        <div className="flex-shrink-0">
          <FollowButtonSmall
            targetUserId={user.id}
            initialIsFollowing={isFollowing}
          />
        </div>
      )}
    </div>
  )
}

