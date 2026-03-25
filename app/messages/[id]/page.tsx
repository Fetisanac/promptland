import { notFound, redirect } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { getMessages } from "@/app/actions/message"
import { ChatWindow } from "@/components/chat-window"

interface ConversationPageProps {
  params: {
    id: string
  }
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login")
  }

  // Conversation'ı kontrol et
  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  })

  if (!conversation) {
    notFound()
  }

  // Kullanıcının participant olduğunu kontrol et
  const participantIds = conversation.participants.map((p) => p.userId)
  if (!participantIds.includes(authUser.id)) {
    redirect("/messages")
  }

  // Karşı tarafı bul
  const otherParticipant = conversation.participants.find(
    (p) => p.userId !== authUser.id,
  )

  if (!otherParticipant) {
    redirect("/messages")
  }

  // Mesajları çek
  const result = await getMessages(params.id)

  if ("error" in result) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-400">{result.error}</p>
      </div>
    )
  }

  return (
    <ChatWindow
      conversationId={params.id}
      otherUser={{
        id: otherParticipant.user.id,
        username: otherParticipant.user.username,
        fullName: otherParticipant.user.fullName,
        avatarUrl: otherParticipant.user.avatarUrl,
      }}
      initialMessages={result.messages}
      currentUserId={authUser.id}
    />
  )
}







