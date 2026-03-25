"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCallback } from "react"

type PromptCardData = {
  id: string
  title: string
  model: string | null
  imageUrl: string | null
  authorUsername: string
}

interface LandingPageClientProps {
  prompts: PromptCardData[]
}

export function LandingPageClient({ prompts }: LandingPageClientProps) {
  const handleScrollToFeatured = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const el = document.getElementById("featured")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }, [])

  return (
    <main className="min-h-screen bg-background text-foreground relative">
      {/* Top Navigation - Sağ Üst Köşe */}
      <header className="fixed top-0 right-0 z-50 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <Link href="/auth/login">
            <Button
              variant="outline"
              className="border-border"
            >
              Giriş Yap
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button>
              Kayıt Ol
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-16 text-center">
        <div className="relative z-10 max-w-4xl space-y-8">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Premium AI Prompt Platformu
          </p>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            <span className="text-foreground">
              Yapay Zeka Sanatının
            </span>
            <br />
            <span className="text-foreground">
              Sınırlarını Zorla
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base md:text-lg text-muted-foreground">
            Midjourney, DALL-E, Stable Diffusion, Gemini ve Sora için tasarlanmış
            en etkileyici prompt koleksiyonlarını keşfet. Kendi sahneni oluştur,
            toplulukla paylaş.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base font-semibold px-8 py-6"
              >
                Hemen Başla
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={handleScrollToFeatured}
              className="w-full sm:w-auto text-base font-medium"
            >
              Keşfet
            </Button>
          </div>
        </div>
      </section>

      {/* Showcase / Marquee tarzı grid */}
      <section className="relative overflow-hidden border-y border-border bg-background py-8">
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-6">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
            Canlı Önizleme
          </p>
          {prompts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Henüz görsel eklenmemiş. İlk prompt kolajını sen başlat.
            </div>
          ) : (
            <div className="relative h-40 overflow-hidden">
              <div className="absolute inset-0 animate-[marquee_40s_linear_infinite] flex gap-4 will-change-transform">
                {[...Array(2)].map((_, loopIndex) => (
                  <div
                    key={loopIndex}
                    className="flex gap-4 pr-4"
                    aria-hidden={loopIndex === 1}
                  >
                    {prompts.map((p) => (
                      <div
                        key={`${p.id}-${loopIndex}`}
                        className="flex h-36 w-56 flex-col justify-between rounded-lg border border-border bg-card px-3 py-2 text-left"
                      >
                        <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                          {p.model || "AI Model"}
                        </div>
                        <p className="line-clamp-2 text-xs font-medium text-foreground">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          @{p.authorUsername}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-14">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Neden Promptland?
            </h2>
            <p className="text-base text-muted-foreground">
              Üretken yapay zeka için tasarlanmış premium bir deneyim.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FeatureCard
              title="Küratörlü Promptlar"
              description="Topluluk tarafından oylanmış, en iyi performans gösteren prompt koleksiyonlarına eriş."
            />
            <FeatureCard
              title="Canlı Portfolyolar"
              description="Kendi AI sanat portfolyonu oluştur, takipçiler kazan ve işbirlikleri kur."
            />
            <FeatureCard
              title="Model Odaklı Filtreler"
              description="Midjourney, DALL‑E, Stable Diffusion, Gemini ve Sora için özel filtrelerle zaman kazan."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Promptland. Tüm hakları saklıdır.</p>
      </footer>
    </main>
  )
}

function FeatureCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 hover:border-foreground/20 transition-colors">
      <div className="relative space-y-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
