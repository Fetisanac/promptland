import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { MessagesLayoutClient } from "@/components/messages-layout-client"

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login")
  }

  // Kullanıcıyı Prisma'da kontrol et
  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
  })

  if (!dbUser) {
    redirect("/auth/login")
  }

  // Conversation'ları çek
  const { getConversations } = await import("@/app/actions/message")
  const result = await getConversations()

  if ("error" in result) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-slate-400">{result.error}</p>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <MessagesLayoutClient
        initialConversations={result.conversations}
        currentUserId={authUser.id}
      >
        {children}
      </MessagesLayoutClient>
    </div>
  )
}





