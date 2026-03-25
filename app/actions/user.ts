"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

export async function toggleFollow(targetUserId: string) {
  try {
    // Oturum kontrolü
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Kendini takip etmeye çalışıyorsa engelle
    if (user.id === targetUserId) {
      return { error: "Kendinizi takip edemezsiniz." }
    }

    // Kullanıcıyı Prisma'da kontrol et (yoksa oluştur)
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    })

    if (!dbUser) {
      // Username için e-postanın '@' işaretinden önceki kısmını al ve rastgele 3 hane ekle
      const emailPrefix = user.email!.split("@")[0]
      const randomSuffix = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")
      const username = `${emailPrefix}${randomSuffix}`

      // fullName için metadata'dan al, yoksa kullanıcı adını kullan
      const fullName =
        (user.user_metadata as any)?.fullName ||
        (user.user_metadata as any)?.name ||
        user.email!.split("@")[0] ||
        ""

      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          username: username,
          fullName: fullName,
        },
      })
    }

    // Hedef kullanıcının var olduğunu kontrol et
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return { error: "Kullanıcı bulunamadı." }
    }

    // Mevcut takip ilişkisini kontrol et
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    })

    if (existingFollow) {
      // Takibi kaldır (Unfollow)
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: targetUserId,
          },
        },
      })
    } else {
      // Takip et (Follow)
      await prisma.follows.create({
        data: {
          followerId: user.id,
          followingId: targetUserId,
        },
      })

      // Takip edilen kişiye bildirim oluştur
      await prisma.notification.create({
        data: {
          recipientId: targetUserId,
          issuerId: user.id,
          type: "FOLLOW",
        },
      })
      revalidatePath("/notifications")
    }

    // Cache'i temizle
    revalidatePath("/")
    revalidatePath("/profile")
    revalidatePath(`/profile/${targetUser.username}`)

    return { success: true }
  } catch (error) {
    console.error("Follow toggle hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Takip işlemi sırasında bir hata oluştu.",
    }
  }
}

export async function getFollowingUsers() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Kullanıcının takip ettiği kişileri getir
    const follows = await prisma.follows.findMany({
      where: {
        followerId: user.id,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const users = follows.map((follow) => ({
      id: follow.following.id,
      username: follow.following.username,
      fullName: follow.following.fullName,
      avatarUrl: follow.following.avatarUrl,
      bio: follow.following.bio,
    }))

    return { users }
  } catch (error) {
    console.error("Takip edilen kullanıcıları getirme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Kullanıcılar yüklenirken bir hata oluştu.",
    }
  }
}

export async function searchUsersForMessage(query: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    let users

    if (!query || query.trim().length === 0) {
      // Query boşsa son kayıt olan 5 kullanıcıyı getir (kendini hariç tut)
      users = await prisma.user.findMany({
        where: {
          id: {
            not: user.id,
          },
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      })
    } else {
      // Query doluysa username veya fullName içinde arama yap (kendini hariç tut)
      const searchQuery = query.trim()
      users = await prisma.user.findMany({
        where: {
          AND: [
            {
              id: {
                not: user.id,
              },
            },
            {
              OR: [
                {
                  username: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
                {
                  fullName: {
                    contains: searchQuery,
                    mode: "insensitive",
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
        },
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
      })
    }

    return { users }
  } catch (error) {
    console.error("Kullanıcı arama hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Kullanıcılar aranırken bir hata oluştu.",
    }
  }
}

