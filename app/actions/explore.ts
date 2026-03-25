"use server"

import { prisma } from "@/lib/prisma"

export async function searchContent(query: string) {
  if (!query || query.trim().length === 0) {
    return { users: [], prompts: [] }
  }

  const searchQuery = query.trim()

  try {
    const [users, prompts] = await Promise.all([
      // Kullanıcı araması - username veya fullName'e göre
      prisma.user.findMany({
        where: {
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
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
          _count: {
            select: {
              prompts: true,
              followers: true,
            },
          },
        },
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
      }),

      // Prompt araması - title veya tags'e göre
      prisma.prompt.findMany({
        where: {
          deletedAt: null, // Sadece silinmemiş promptları getir
          OR: [
            {
              title: {
                contains: searchQuery,
                mode: "insensitive",
              },
            },
            {
              tags: {
                has: searchQuery,
              },
            },
          ],
        },
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
        take: 20,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ])

    return {
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        promptCount: u._count.prompts,
        followerCount: u._count.followers,
      })),
      prompts: prompts.map((p) => ({
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
      })),
    }
  } catch (error) {
    console.error("Search error:", error)
    return { users: [], prompts: [] }
  }
}

export async function getPopularTags() {
  try {
    const prompts = await prisma.prompt.findMany({
      select: {
        tags: true,
      },
    })

    // Tüm tagleri topla ve say
    const tagCounts: Record<string, number> = {}
    prompts.forEach((prompt) => {
      prompt.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    // En popüler 10 tag'i döndür
    const popularTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)

    return popularTags
  } catch (error) {
    console.error("Get popular tags error:", error)
    return []
  }
}


