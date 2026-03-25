import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const type = searchParams.get("type")

    if (!userId || !type || (type !== "followers" && type !== "following")) {
      return NextResponse.json(
        { error: "Geçersiz parametreler." },
        { status: 400 },
      )
    }

    let users

    if (type === "followers") {
      // Beni takip edenler
      const follows = await prisma.follows.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      })
      users = follows.map((f) => f.follower)
    } else {
      // Benim takip ettiklerim
      const follows = await prisma.follows.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      })
      users = follows.map((f) => f.following)
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error("Follow list hatası:", error)
    return NextResponse.json(
      { error: "Kullanıcı listesi alınırken bir hata oluştu." },
      { status: 500 },
    )
  }
}







