import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

/**
 * Eski /profile rotası - Kullanıcıyı kendi profil sayfasına yönlendirir
 */
export default async function ProfileRedirect() {
  const supabase = createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect("/auth/login")
  }

  // Kullanıcıyı Prisma'da bul
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { username: true },
  })

  if (!user) {
    // Kullanıcı yoksa oluştur
    const newUser = await prisma.user.create({
      data: {
        id: authUser.id,
        email: authUser.email!,
        username:
          (authUser.user_metadata as any)?.username ||
          authUser.email!.split("@")[0],
        fullName: (authUser.user_metadata as any)?.fullName || "",
      },
      select: { username: true },
    })
    redirect(`/profile/${newUser.username}`)
  }

  redirect(`/profile/${user.username}`)
}
