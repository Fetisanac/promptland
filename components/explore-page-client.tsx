"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { FeedCard } from "@/components/feed-card"
import { UserCard } from "@/components/user-card"
import { Button } from "@/components/ui/button"

interface Prompt {
  id: string
  title: string
  description: string | null
  promptText: string
  imageUrl: string | null
  videoUrl?: string | null
  model: string | null
  tags: string[]
  userId: string
  user: {
    id: string
    username: string
    fullName: string | null
    avatarUrl: string | null
  }
  _count: {
    likes: number
    comments: number
  }
}

interface User {
  id: string
  username: string
  fullName: string
  avatarUrl: string | null
  bio: string | null
  promptCount: number
  followerCount: number
}

interface ExplorePageClientProps {
  searchQuery: string
  searchResults: {
    users: User[]
    prompts: Prompt[]
  } | null
  defaultPrompts: Prompt[]
  popularTags: string[]
  followingMap: Record<string, boolean>
  currentUserId: string
}

export function ExplorePageClient({
  searchQuery: initialQuery,
  searchResults,
  defaultPrompts,
  popularTags,
  followingMap,
  currentUserId,
}: ExplorePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmedQuery = query.trim()
    
    startTransition(() => {
      if (trimmedQuery) {
        router.push(`/explore?q=${encodeURIComponent(trimmedQuery)}`)
      } else {
        router.push("/explore")
      }
    })
  }

  const handleTagClick = (tag: string) => {
    setQuery(tag)
    startTransition(() => {
      router.push(`/explore?q=${encodeURIComponent(tag)}`)
    })
  }

  const hasSearchResults = searchResults !== null
  const hasUsers = searchResults?.users && searchResults.users.length > 0
  const hasPrompts = searchResults?.prompts && searchResults.prompts.length > 0
  const hasDefaultPrompts = defaultPrompts.length > 0

  return (
    <div className="space-y-8">
      {/* Arama Çubuğu */}
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Keşfet
        </h1>
        <p className="text-sm text-muted-foreground">
          Kullanıcı, prompt veya etiket ara...
        </p>

        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Kullanıcı, prompt veya etiket ara..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 w-full text-xl h-14 rounded-none border-2 border-border bg-transparent"
            disabled={isPending}
          />
        </form>
      </section>

      {/* Arama Sonuçları */}
      {hasSearchResults && (
        <>
          {/* Kullanıcılar */}
          {hasUsers && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Kullanıcılar
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {searchResults.users.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId}
                    isFollowing={followingMap[user.id] || false}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Gönderiler */}
          {hasPrompts && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                İlgili Gönderiler
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.prompts.map((prompt) => (
                  <FeedCard
                    key={prompt.id}
                    prompt={prompt}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Sonuç Yok */}
          {!hasUsers && !hasPrompts && (
            <div className="rounded-lg border border-border bg-card px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Arama sonucu bulunamadı.
              </p>
              {popularTags.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Popüler Etiketler</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {popularTags.map((tag) => (
                      <Button
                        key={tag}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTagClick(tag)}
                        className="rounded-md border border-border"
                      >
                        #{tag}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Varsayılan İçerik (Arama yapılmadıysa) */}
      {!hasSearchResults && (
        <>
          {/* Popüler Etiketler */}
          {popularTags.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Popüler Etiketler
              </h2>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => handleTagClick(tag)}
                    className="rounded-md border border-border"
                  >
                    #{tag}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {/* Göz Atabileceğin Promptlar */}
          {hasDefaultPrompts && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Göz Atabileceğin Promptlar
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {defaultPrompts.map((prompt) => (
                  <FeedCard
                    key={prompt.id}
                    prompt={prompt}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Boş Durum */}
          {!hasDefaultPrompts && (
            <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
              Henüz kimse paylaşım yapmadı.
            </div>
          )}
        </>
      )}
    </div>
  )
}











