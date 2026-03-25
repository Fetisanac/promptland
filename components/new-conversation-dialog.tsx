"use client"

import { useState, useTransition, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Search } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { searchUsersForMessage } from "@/app/actions/user"
import { startConversation } from "@/app/actions/message"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  username: string
  fullName: string
  avatarUrl: string | null
  bio: string | null
}

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewConversationDialog({
  open,
  onOpenChange,
}: NewConversationDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const loadUsers = useCallback(async (query: string) => {
    setIsLoading(true)
    const result = await searchUsersForMessage(query)
    if (!("error" in result)) {
      setUsers(result.users)
    }
    setIsLoading(false)
  }, [])

  // Dialog açıldığında varsayılan kullanıcıları yükle
  useEffect(() => {
    if (open) {
      loadUsers("")
    } else {
      // Dialog kapandığında state'i temizle
      setSearchQuery("")
      setUsers([])
    }
  }, [open, loadUsers])

  // Arama query'si değiştiğinde kullanıcıları yükle (debounce)
  useEffect(() => {
    if (!open) return

    // Önceki timeout'u temizle
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Yeni timeout ayarla (500ms debounce)
    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(searchQuery)
    }, 500)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, open, loadUsers])

  const handleUserClick = async (userId: string) => {
    startTransition(async () => {
      const result = await startConversation(userId)
      if ("error" in result) {
        alert(result.error)
      } else {
        onOpenChange(false)
        router.push(`/messages/${result.conversationId}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
            Yeni Mesaj
          </DialogTitle>
        </DialogHeader>

        {/* Arama Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Kullanıcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 rounded-md border-0"
          />
        </div>

        {/* Kullanıcı Listesi */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Yükleniyor...
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "Sonuç bulunamadı" : "Kullanıcı bulunamadı"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  disabled={isPending}
                  className="flex w-full items-center gap-3 p-4 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatarUrl ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-full">
                        <Image
                          src={user.avatarUrl}
                          alt={user.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
                        {(user.fullName || user.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* İçerik */}
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

