import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyPromptButton } from "@/components/copy-prompt-button"
import { CommentInput } from "@/components/comment-input"
import { CommentList } from "@/components/comment-list"

interface PromptDetailPageProps {
  params: {
    id: string
  }
}

export default async function PromptDetailPage({
  params,
}: PromptDetailPageProps) {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const prompt = await prisma.prompt.findFirst({
    where: {
      id: params.id,
      deletedAt: null, // Sadece silinmemiş promptları getir
    },
    include: {
      user: true,
      likes: authUser
        ? {
            where: { userId: authUser.id },
            select: { id: true },
          }
        : undefined,
      savedBy: authUser
        ? {
            where: { userId: authUser.id },
            select: { id: true },
          }
        : undefined,
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
    },
  })

  // Yorumları çek (kullanıcının beğenip beğenmediği bilgisi ile)
  const comments = authUser
    ? await prisma.comment.findMany({
        where: { promptId: params.id },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
          commentLikes: {
            where: { userId: authUser.id },
            select: { id: true },
          },
          _count: {
            select: {
              commentLikes: true,
            },
          },
        },
      })
    : await prisma.comment.findMany({
        where: { promptId: params.id },
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              commentLikes: true,
            },
          },
        },
      })

  // Yorumları formatla (isLiked ekle)
  const formattedComments = comments.map((c) => ({
    id: c.id,
    content: c.content,
    imageUrl: c.imageUrl,
    createdAt: c.createdAt,
    user: {
      username: c.user.username,
      avatarUrl: c.user.avatarUrl,
    },
    isLiked: authUser ? (c as any).commentLikes?.length > 0 : false,
    _count: {
      commentLikes: c._count.commentLikes,
    },
  }))

  if (!prompt) {
    notFound()
  }

  // Görüntülenme sayısını artır
  await prisma.prompt.update({
    where: { id: params.id },
    data: { views: { increment: 1 } },
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-8">
        {/* Geri Dön Butonu */}
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Button>
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Sol Taraf - Medya */}
          <div className="space-y-4">
            {prompt.videoUrl ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border bg-card">
                <video
                  src={prompt.videoUrl}
                  controls
                  className="h-full w-full object-cover"
                />
              </div>
            ) : prompt.imageUrl ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border bg-card">
                <Image
                  src={prompt.imageUrl}
                  alt={prompt.title}
                  fill
                  className="object-cover"
                  unoptimized={prompt.imageUrl.startsWith("http")}
                  priority
                />
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-md border border-border bg-card text-muted-foreground">
                Medya yok
              </div>
            )}
          </div>

          {/* Sağ Taraf - Prompt Detayları */}
          <div className="space-y-6">
            {/* Başlık ve Yazar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
                  {prompt.model || "Model"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {prompt.views} görüntülenme
                </div>
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {prompt.title}
              </h1>

              <div className="flex items-center gap-3">
                <Link
                  href={`/profile/${prompt.user.username}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                    {prompt.user.username.charAt(0).toUpperCase()}
                  </div>
                  <span>@{prompt.user.username}</span>
                </Link>
              </div>
            </div>

            {/* Açıklama */}
            {prompt.description && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Açıklama
                </h2>
                <p className="text-muted-foreground">{prompt.description}</p>
              </div>
            )}

            {/* Prompt Metni */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Prompt Metni
                </h2>
                <CopyPromptButton promptText={prompt.promptText} />
              </div>
              <div className="rounded-md border border-border bg-card p-4">
                <p className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                  {prompt.promptText}
                </p>
              </div>
            </div>

            {/* Etiketler */}
            {prompt.tags.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  Etiketler
                </h2>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* İstatistikler */}
            <div className="flex items-center gap-0 divide-x divide-border rounded-md border border-border bg-card p-4">
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {prompt._count.likes}
                </div>
                <div className="text-xs text-muted-foreground">Beğeni</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {prompt._count.comments}
                </div>
                <div className="text-xs text-muted-foreground">Yorum</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-foreground">
                  {prompt.views}
                </div>
                <div className="text-xs text-muted-foreground">Görüntülenme</div>
              </div>
            </div>
          </div>
        </div>

        {/* Yorumlar Bölümü */}
        <div id="comments" className="mt-12 rounded-lg border border-border bg-card">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Yorumlar ({prompt._count.comments})
            </h2>
          </div>

          {/* Yorum Yapma Formu */}
          {authUser && (
            <div className="p-6 border-b border-border">
              <CommentInput promptId={params.id} />
            </div>
          )}

          {/* Yorum Listesi */}
          <div className="divide-y divide-border">
            <CommentList comments={formattedComments} />
          </div>
        </div>
      </div>
    </div>
  )
}


