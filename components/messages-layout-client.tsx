"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getConversations } from "@/app/actions/message"
import { NewConversationDialog } from "@/components/new-conversation-dialog"

interface Conversation {
  id: string
  updatedAt: string
  otherUser: {
    id: string
    username: string
    fullName: string
    avatarUrl: string | null
  } | null
  lastMessage: {
    id: string
    content: string
    createdAt: string
    senderId: string
  } | null
}

interface MessagesLayoutClientProps {
  children: React.ReactNode
  initialConversations: Conversation[]
  currentUserId: string
}

export function MessagesLayoutClient({
  children,
  initialConversations,
  currentUserId,
}: MessagesLayoutClientProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Sayfa değiştiğinde conversation'ları yenile
    const refreshConversations = async () => {
      const result = await getConversations()
      if (!("error" in result)) {
        setConversations(result.conversations)
      }
    }

    refreshConversations()
  }, [pathname])

  const filteredConversations = conversations.filter((conv) => {
    if (!conv.otherUser) return false
    const searchLower = searchQuery.toLowerCase()
    return (
      conv.otherUser.username.toLowerCase().includes(searchLower) ||
      conv.otherUser.fullName.toLowerCase().includes(searchLower) ||
      (conv.lastMessage?.content.toLowerCase().includes(searchLower) ?? false)
    )
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Az önce"
    if (minutes < 60) return `${minutes} dk`
    if (hours < 24) return `${hours} sa`
    if (days < 7) return `${days} gün`
    return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
  }

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  return (
    <div className="flex w-full">
      {/* Sol Sidebar - Konuşma Listesi */}
      <aside className="w-80 border-r border-border bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Mesajlar
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsNewConversationOpen(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Yeni Mesaj
          </Button>
        </div>

        {/* New Conversation Dialog */}
        <NewConversationDialog
          open={isNewConversationOpen}
          onOpenChange={setIsNewConversationOpen}
        />

        {/* Arama Input */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 rounded-md border-0"
            />
          </div>
        </div>

        {/* Konuşma Listesi */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {searchQuery ? "Sonuç bulunamadı" : "Henüz sohbet yok"}
            </div>
          ) : (
            <div>
              {filteredConversations.map((conv, index) => {
                if (!conv.otherUser) return null

                const isActive = pathname === `/messages/${conv.id}`
                const isLastMessageFromMe = conv.lastMessage?.senderId === currentUserId
                const isLast = index === filteredConversations.length - 1

                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className={cn(
                      "flex items-center gap-3 p-4 transition-colors",
                      !isLast && "border-b border-border",
                      isActive
                        ? "bg-accent border-l-4 border-primary"
                        : "hover:bg-accent/50",
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      {conv.otherUser.avatarUrl ? (
                        <div className="relative h-12 w-12 overflow-hidden rounded-full">
                          <Image
                            src={conv.otherUser.avatarUrl}
                            alt={conv.otherUser.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                          {(conv.otherUser.fullName || conv.otherUser.username)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {conv.otherUser.fullName || conv.otherUser.username}
                        </p>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                            {formatDate(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <p className="text-sm truncate text-muted-foreground">
                          {isLastMessageFromMe && "Sen: "}
                          {truncateMessage(conv.lastMessage.content)}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Henüz mesaj yok</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Sağ Taraf - Chat Alanı */}
      <main className="flex-1 flex flex-col bg-background">{children}</main>
    </div>
  )
}





