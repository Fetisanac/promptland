import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { TopNavbar } from "./top-navbar"

export async function TopNavbarServer() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Kullanıcıyı Prisma'dan al (username için)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { username: true, fullName: true },
  })

  const displayName =
    dbUser?.fullName ||
    dbUser?.username ||
    (user.user_metadata as any)?.fullName ||
    (user.user_metadata as any)?.username ||
    user.email?.split("@")[0] ||
    ""

  const username = dbUser?.username || user.email?.split("@")[0] || ""

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "P"

  return (
    <TopNavbar
      userInitial={initial}
      displayName={displayName}
      username={username}
    />
  )
}



