"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface NewPromptDialogProps {
  children: React.ReactNode
}

export function NewPromptDialog({ children }: NewPromptDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    // TODO: Implement prompt creation logic
    // This will be connected to a server action later

    setTimeout(() => {
      setLoading(false)
      setOpen(false)
      // Show success message
    }, 1000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Yeni Prompt Oluştur
          </DialogTitle>
          <DialogDescription>
            AI promptunu paylaş ve toplulukla buluştur.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Başlık</Label>
            <Input
              id="title"
              name="title"
              placeholder="Prompt başlığı..."
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Prompt hakkında kısa bir açıklama..."
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptText">Prompt Metni</Label>
            <Textarea
              id="promptText"
              name="promptText"
              placeholder="AI promptunuzu buraya yazın..."
              rows={6}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                placeholder="ChatGPT, Midjourney, etc."
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Etiketler (virgülle ayırın)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="art, design, ai"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white hover:from-fuchsia-400 hover:via-violet-400 hover:to-cyan-400"
            >
              {loading ? "Paylaşılıyor..." : "Paylaş"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}













