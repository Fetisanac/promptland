"use client"

import { Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyPromptButton({ promptText }: { promptText: string }) {
  async function handleCopy() {
    await navigator.clipboard.writeText(promptText)
    // TODO: Toast notification ekle
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="text-slate-300 hover:text-white"
    >
      <Copy className="mr-2 h-4 w-4" />
      Kopyala
    </Button>
  )
}











