"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"
import { FollowButtonSmall } from "@/components/follow-button-small"

interface User {
  id: string
  username: string
  fullName: string | null
  avatarUrl: string | null
}

interface TrendingPrompt {
  id: string
  title: string
  authorUsername: string
  likeCount: number
}

interface RightSidebarClientProps {
  usersToFollow: User[]
  trendingPrompts: TrendingPrompt[]
  followingMap: Record<string, boolean>
}

export function RightSidebarClient({
  usersToFollow,
  trendingPrompts,
  followingMap,
}: RightSidebarClientProps) {
  return (
    <aside className="sticky top-24 space-y-6">
      {/* Kimi Takip Etmeli? */}
      {usersToFollow.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Kimi Takip Etmeli?
          </h2>
          <div className="space-y-3">
            {usersToFollow.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors"
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {user.avatarUrl ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={user.avatarUrl}
                        alt={user.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                      {(user.fullName || user.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* İsim ve Kullanıcı Adı */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </p>
                </div>

                {/* Takip Et Butonu */}
                <div className="flex-shrink-0">
                  <FollowButtonSmall
                    targetUserId={user.id}
                    initialIsFollowing={followingMap[user.id] || false}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Popüler İçerikler */}
      {trendingPrompts.length > 0 ? (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Popüler İçerikler
          </h2>
          <div className="space-y-2">
            {trendingPrompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompt/${prompt.id}`}
                className="flex items-start gap-3 rounded-md p-2 hover:bg-muted transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {prompt.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    @{prompt.authorUsername}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                  <Heart className="h-3 w-3 fill-current" />
                  <span>{prompt.likeCount}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Eğer hiç veri yoksa - Her zaman göster */}
      {usersToFollow.length === 0 && trendingPrompts.length === 0 && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Öneriler
          </h2>
          <p className="text-xs text-muted-foreground">
            Önerilen hesaplar ve popüler içerikler yakında...
          </p>
        </div>
      )}
    </aside>
  )
}

