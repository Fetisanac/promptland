"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface User {
  id: string
  username: string
  fullName: string
  avatarUrl: string | null
}

interface FollowListDialogProps {
  userId: string
  type: "followers" | "following"
  trigger: React.ReactNode
}

export function FollowListDialog({
  userId,
  type,
  trigger,
}: FollowListDialogProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && users.length === 0) {
      fetchUsers()
    }
  }, [open])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/follow-list?userId=${userId}&type=${type}`,
      )
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Kullanıcı listesi yüklenirken hata:", error)
    } finally {
      setLoading(false)
    }
  }

  const title = type === "followers" ? "Takipçiler" : "Takip Edilenler"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-slate-400">Yükleniyor...</div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-slate-400">
              {type === "followers"
                ? "Henüz takipçi yok."
                : "Henüz kimse takip edilmiyor."}
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-3"
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
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold">
                      {(user.fullName || user.username).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Kullanıcı Bilgisi */}
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">
                    {user.fullName || user.username}
                  </p>
                  <p className="text-sm text-slate-400">@{user.username}</p>
                </div>

                {/* Profil Git Butonu */}
                <Link href={`/profile/${user.username}`} onClick={() => setOpen(false)}>
                  <Button size="sm" variant="outline">
                    Profil Git
                  </Button>
                </Link>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

