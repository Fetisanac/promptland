"use client"

import { MessageSquareDashed, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function MessagesPage() {
  const router = useRouter()

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="flex justify-center">
          <div className="rounded-full border-2 border-border p-6">
            <MessageSquareDashed className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Gelen Kutusu
          </h2>
          <p className="text-sm text-muted-foreground">
            Bir sohbet seçin veya yeni bir görüşme başlatın.
          </p>
        </div>
        <Button
          onClick={() => router.push("/explore")}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Yeni Mesaj Oluştur
        </Button>
      </div>
    </div>
  )
}





