"use client"

import { CreatePromptDialog } from "./create-prompt-dialog"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

export function NewPromptButton() {
  return (
    <CreatePromptDialog>
      <Button
        className="w-full"
        size="lg"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Yeni Prompt Oluştur
      </Button>
    </CreatePromptDialog>
  )
}

