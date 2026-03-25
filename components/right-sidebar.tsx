import { getWhoToFollow, getTrendingPrompts } from "@/app/actions/sidebar"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { RightSidebarClient } from "@/components/right-sidebar-client"

export async function RightSidebar() {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  // Verileri çek
  const [whoToFollowResult, trendingResult] = await Promise.all([
    getWhoToFollow(),
    getTrendingPrompts(),
  ])

  const usersToFollow = whoToFollowResult.users || []
  const trendingPrompts = trendingResult.prompts || []

  // Kullanıcının takip durumlarını kontrol et
  const followingMap: Record<string, boolean> = {}

  if (usersToFollow.length > 0) {
    const following = await prisma.follows.findMany({
      where: {
        followerId: authUser.id,
        followingId: {
          in: usersToFollow.map((u) => u.id),
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

  return (
    <RightSidebarClient
      usersToFollow={usersToFollow}
      trendingPrompts={trendingPrompts}
      followingMap={followingMap}
    />
  )
}

