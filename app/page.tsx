import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { LandingPage } from "@/components/landing-page"
import { NewPromptButton } from "@/components/new-prompt-button"
import { FeedCard } from "@/components/feed-card"
import { RightSidebar } from "@/components/right-sidebar"

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  // Eğer kullanıcı yoksa veya auth hatası varsa Landing Page göster
  if (!authUser || authError) {
    return <LandingPage />
  }

  // Kullanıcı varsa kesinlikle Landing Page gösterme, Feed göster

  const [dbUser, prompts] = await Promise.all([
    prisma.user.findUnique({ where: { id: authUser.id } }),
    prisma.prompt.findMany({
      where: {
        deletedAt: null, // Sadece silinmemiş promptları getir
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        likes: {
          where: { userId: authUser.id },
          select: { id: true },
        },
        savedBy: {
          where: { userId: authUser.id },
          select: { id: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
  ])

  // Prompt verilerini formatla (isLiked ve isSaved ekle ve serialize et)
  const formattedPrompts = prompts.map((p) => ({
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
    },
    isLiked: p.likes.length > 0,
    isSaved: p.savedBy.length > 0,
    _count: p._count,
  }))

  const displayName =
    dbUser?.fullName ||
    dbUser?.username ||
    (authUser.user_metadata as any)?.fullName ||
    authUser.email?.split("@")[0] ||
    "Promptland kullanıcısı"

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        {/* 3 Sütunlu Grid Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Sol Sütun - Yeni Prompt Butonu */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="sticky top-24">
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="mb-4 text-sm font-semibold text-foreground">
                  Oluştur
                </h2>
                <NewPromptButton />
              </div>
            </div>
          </aside>

          {/* Orta Sütun - Feed */}
          <main className="col-span-12 lg:col-span-6">
            <div className="space-y-8">
              <section className="space-y-3">
                <h1 className="text-2xl font-semibold text-foreground">
                  Hoş geldin, {displayName.split(" ")[0]} 👋
                </h1>
                <p className="text-sm text-muted-foreground">
                  Topluluktan en yeni promptları keşfet.
                </p>
              </section>

              <section className="space-y-6">
                {formattedPrompts.length === 0 ? (
                  <div className="rounded-lg border border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
                    Henüz kimse paylaşım yapmadı. İlk promptu paylaşan sen ol!
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formattedPrompts.map((p) => (
                      <FeedCard key={p.id} prompt={p} currentUserId={authUser.id} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>

          {/* Sağ Sütun - Öneriler */}
          <aside className="col-span-12 lg:col-span-3">
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  )
}


