"use server"

import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

export async function getWhoToFollow() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { users: [] }
    }

    // Kullanıcının takip ettiklerini al
    const following = await prisma.follows.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    })

    const followingIds = following.map((f) => f.followingId)

    // Şu anki kullanıcıyı ve takip ettiklerini hariç tutarak rastgele 3 kullanıcı çek
    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: [user.id, ...followingIds],
        },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
      },
      take: 3,
      orderBy: {
        createdAt: "desc", // En yeni kullanıcılar
      },
    })

    return { users }
  } catch (error) {
    console.error("Kimi takip etmeli hatası:", error)
    return { users: [] }
  }
}

export async function getTrendingPrompts() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Tüm promptları çek ve beğeni sayısına göre sırala
    const prompts = await prisma.prompt.findMany({
      where: {
        deletedAt: null, // Sadece silinmemiş promptları getir
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    })

    // Beğeni sayısına göre sırala ve en çok beğenilen 3'ü al
    const sortedPrompts = prompts
      .sort((a, b) => b._count.likes - a._count.likes)
      .slice(0, 3)

    // Promptları formatla
    const formattedPrompts = sortedPrompts.map((p) => ({
      id: p.id,
      title: p.title,
      authorUsername: p.user.username,
      likeCount: p._count.likes,
    }))

    return { prompts: formattedPrompts }
  } catch (error) {
    console.error("Trending prompts hatası:", error)
    return { prompts: [] }
  }
}

