import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import { ProfileTabs } from "@/components/profile-tabs"
import { FollowButton } from "@/components/follow-button"
import { FollowListDialog } from "@/components/follow-list-dialog"
import { MessageButton } from "@/components/message-button"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Profil sahibini bul
  const profileUser = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          prompts: true,
        },
      },
      followers: authUser
        ? {
            where: { followerId: authUser.id },
            select: { followerId: true },
          }
        : false,
    },
  })

  if (!profileUser) {
    notFound()
  }

  // Oturum açmış kullanıcı kontrolü
  const isOwner = authUser?.id === profileUser.id

  // Eğer kullanıcı giriş yapmamışsa ve kendi profilini görüntülemeye çalışıyorsa login'e yönlendir
  if (!authUser && isOwner) {
    redirect("/auth/login")
  }

  const followers = profileUser._count.followers
  const following = profileUser._count.following
  const posts = profileUser._count.prompts

  // Ziyaretçi bu profili takip ediyor mu?
  const isFollowing =
    authUser && profileUser.followers && profileUser.followers.length > 0

  // Kullanıcının promptlarını çek (isLiked bilgisi ile)
  const userPrompts = await prisma.prompt.findMany({
    where: {
      userId: profileUser.id,
      deletedAt: null, // Sadece silinmemiş promptları getir
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      likes: authUser
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

  // Kullanıcının beğendiği promptları çek (sadece sahibi görürse)
  const likedPrompts = isOwner
    ? await prisma.prompt.findMany({
        where: {
          deletedAt: null, // Sadece silinmemiş promptları getir
          likes: {
            some: {
              userId: profileUser.id,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          likes: authUser
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
    : []

  // Kullanıcının kaydettiği promptları çek (sadece sahibi görürse)
  const savedPrompts = isOwner
    ? await prisma.prompt.findMany({
        where: {
          savedBy: {
            some: {
              userId: profileUser.id,
            },
          },
        },
        orderBy: { createdAt: "desc" },
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
    : []

  // Prompt verilerini formatla (isLiked ekle ve serialize et)
  const formattedPosts = userPrompts.map((p) => ({
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
    isLiked: authUser ? (p.likes?.length ?? 0) > 0 : false,
    _count: p._count,
  }))

  const formattedLikedPosts = likedPrompts.map((p) => ({
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
    isLiked: authUser ? (p.likes?.length ?? 0) > 0 : false,
    _count: p._count,
  }))

  const formattedSavedPosts = savedPrompts.map((p) => ({
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
    isLiked: authUser ? (p.likes?.length ?? 0) > 0 : false,
    isSaved: authUser ? (p.savedBy?.length ?? 0) > 0 : false,
    _count: p._count,
  }))

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8">
        {/* Kapak + Avatar */}
        <section className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="relative h-48 w-full bg-muted">
            {profileUser.coverUrl && (
              <Image
                src={profileUser.coverUrl}
                alt="Kapak fotoğrafı"
                fill
                className="object-cover"
              />
            )}
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className="-mt-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-6">
                <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-muted">
                  {profileUser.avatarUrl ? (
                    <Image
                      src={profileUser.avatarUrl}
                      alt={profileUser.fullName || profileUser.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-foreground">
                      {(profileUser.fullName || profileUser.username)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="space-y-2 pb-2">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {profileUser.fullName || profileUser.username}
                  </h1>
                  <p className="text-sm font-medium text-muted-foreground">@{profileUser.username}</p>
                  {profileUser.bio && (
                    <p className="max-w-xl text-sm text-foreground">
                      {profileUser.bio}
                    </p>
                  )}
                  {profileUser.website && (
                    <a
                      href={profileUser.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {profileUser.website}
                    </a>
                  )}
                  <div className="flex items-center gap-0 divide-x divide-border text-sm">
                    <span className="pr-4">
                      <span className="text-lg font-bold text-foreground">{posts}</span>
                      <span className="ml-1 text-muted-foreground">Gönderi</span>
                    </span>
                    <FollowListDialog
                      userId={profileUser.id}
                      type="followers"
                      trigger={
                        <span className="cursor-pointer px-4 hover:text-primary transition-colors">
                          <span className="text-lg font-bold text-foreground">{followers}</span>
                          <span className="ml-1 text-muted-foreground">Takipçi</span>
                        </span>
                      }
                    />
                    <FollowListDialog
                      userId={profileUser.id}
                      type="following"
                      trigger={
                        <span className="cursor-pointer pl-4 hover:text-primary transition-colors">
                          <span className="text-lg font-bold text-foreground">{following}</span>
                          <span className="ml-1 text-muted-foreground">Takip Edilen</span>
                        </span>
                      }
                    />
                  </div>
                </div>
              </div>
              {/* Aksiyon Butonları */}
              <div className="flex justify-end md:mb-1 gap-2">
                {isOwner ? (
                  <EditProfileDialog
                    user={{
                      id: profileUser.id,
                      username: profileUser.username,
                      fullName: profileUser.fullName,
                      bio: profileUser.bio,
                      website: profileUser.website,
                      avatarUrl: profileUser.avatarUrl,
                      coverUrl: profileUser.coverUrl,
                    }}
                  />
                ) : (
                  authUser && (
                    <div className="flex gap-2">
                      <FollowButton
                        targetUserId={profileUser.id}
                        initialIsFollowing={isFollowing ?? false}
                      />
                      <MessageButton targetUserId={profileUser.id} />
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs alanı */}
        <ProfileTabs
          posts={formattedPosts}
          likedPosts={formattedLikedPosts}
          savedPosts={formattedSavedPosts}
          showLikesTab={isOwner}
          showSavedTab={isOwner}
          currentUserId={authUser?.id || null}
        />
      </div>
    </div>
  )
}





