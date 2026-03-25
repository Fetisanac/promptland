import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { TopNavbarServer } from "@/components/top-navbar-server"
import { MobileNav } from "@/components/mobile-nav"
import { createClient } from "@/utils/supabase/server"
import { cn } from "@/lib/utils"
import { ThemeProvider } from "@/components/theme-provider"

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Promptland",
  description: "AI promptlarını keşfet ve paylaş",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthenticated = !!user

  return (
    <html
      lang="tr"
      suppressHydrationWarning
    >
      <body
        className={cn(
          "min-h-screen bg-background text-foreground font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          {isAuthenticated ? (
            <>
              <TopNavbarServer />
              <div className="pb-16 lg:pb-0">
                {children}
              </div>
              {/* Mobile Navigation - Bottom */}
              <MobileNav />
            </>
          ) : (
            /* Unauthenticated - Full width (Landing Page) */
            <>{children}</>
          )}
        </ThemeProvider>
      </body>
    </html>
  )
}


