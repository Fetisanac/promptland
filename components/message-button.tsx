"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare } from "lucide-react"
import { startConversation } from "@/app/actions/message"
import { Button } from "@/components/ui/button"

interface MessageButtonProps {
  targetUserId: string
}

export function MessageButton({ targetUserId }: MessageButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleClick = () => {
    startTransition(async () => {
      const result = await startConversation(targetUserId)
      if (result.error) {
        alert(result.error)
      } else if (result.conversationId) {
        router.push(`/messages/${result.conversationId}`)
      }
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant="outline"
      size="md"
      className="border-slate-600 text-slate-300 hover:bg-slate-800"
    >
      <MessageSquare className="mr-2 h-4 w-4" />
      Mesaj Gönder
    </Button>
  )
}







