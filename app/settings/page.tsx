import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { SettingsPageClient } from "@/components/settings-page-client"
import { getRecentlyDeletedPrompts } from "@/app/actions/prompt"

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Silinmiş promptları getir
  const deletedPromptsResult = await getRecentlyDeletedPrompts()
  const deletedPrompts = "error" in deletedPromptsResult ? [] : deletedPromptsResult.prompts

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <SettingsPageClient deletedPrompts={deletedPrompts} />
      </div>
    </div>
  )
}











