import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExplorePageClient } from "@/components/explore-page-client"
import { searchContent, getPopularTags } from "@/app/actions/explore"

interface ExplorePageProps {
  searchParams: {
    q?: string
  }
}

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const query = searchParams.q?.trim() || ""

  // Eğer arama sorgusu varsa arama yap, yoksa rastgele promptlar göster
  let searchResults = null
  let defaultPrompts: any[] = []
  let popularTags: string[] = []

  if (query) {
    searchResults = await searchContent(query)
  } else {
    // Varsayılan: Son promptlar
    defaultPrompts = await prisma.prompt.findMany({
      where: {
        deletedAt: null, // Sadece silinmemiş promptları getir
      },
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    })

    // Popüler etiketleri al
    popularTags = await getPopularTags()
  }

  // Kullanıcının takip durumlarını kontrol et (arama sonuçları için)
  let followingMap: Record<string, boolean> = {}
  if (searchResults?.users && searchResults.users.length > 0) {
    const following = await prisma.follows.findMany({
      where: {
        followerId: user.id,
        followingId: {
          in: searchResults.users.map((u) => u.id),
        },
      },
      select: {
        followingId: true,
      },
    })

    following.forEach((f) => {
      followingMap[f.followingId] = true
    })
  }

  // Prompt verilerini formatla
  const formattedDefaultPrompts = defaultPrompts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    promptText: p.promptText,
    imageUrl: p.imageUrl,
    videoUrl: p.videoUrl,
    model: p.model,
    tags: p.tags,
    userId: p.userId,
    user: {
      id: p.user.id,
      username: p.user.username,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
    },
    _count: p._count,
  }))

  const formattedSearchPrompts = searchResults?.prompts.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    promptText: p.promptText,
    imageUrl: p.imageUrl,
    videoUrl: p.videoUrl,
    model: p.model,
    tags: p.tags,
    userId: p.userId,
    user: {
      id: p.user.id,
      username: p.user.username,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
    },
    _count: p._count,
  })) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        <ExplorePageClient
          searchQuery={query}
          searchResults={searchResults}
          defaultPrompts={formattedDefaultPrompts}
          popularTags={popularTags}
          followingMap={followingMap}
          currentUserId={user.id}
        />
      </div>
    </div>
  )
}











