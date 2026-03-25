import { prisma } from "@/lib/prisma"
import { LandingPageClient } from "./landing-page-client"

export async function LandingPage() {
  const prompts = await prisma.prompt.findMany({
    where: {
      deletedAt: null, // Sadece silinmemiş promptları getir
    },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { user: true },
  })

  const data = prompts.map((p) => ({
    id: p.id,
    title: p.title,
    model: p.model,
    imageUrl: p.imageUrl,
    authorUsername: p.user.username,
  }))

  return <LandingPageClient prompts={data} />
}



















