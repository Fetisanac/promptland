"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signup } from "../actions"
import { cn } from "@/lib/utils"

export default function SignupPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      // Başarılı kayıt - zorla yönlendirme
      router.refresh()
      // window.location kullanarak kesin yönlendirme
      window.location.href = "/"
    }
  }

  return (
    <div className="w-full">
      <div
        className={cn(
          "mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5",
          "backdrop-blur-2xl shadow-[0_0_40px_rgba(236,72,153,0.45)] p-8 space-y-6",
        )}
      >
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">
            Promptland
          </p>
          <h1 className="bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            Aramıza Katıl
          </h1>
          <p className="text-sm text-white/80">
            AI sanatçılarıyla aynı sahnede, en iyi promptlarını paylaş.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-sm font-medium text-white"
            >
              İsim
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              required
              className="border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 backdrop-blur-xl"
              placeholder="Adın Soyadın"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-white"
            >
              Kullanıcı Adı
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              required
              className="border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 backdrop-blur-xl"
              placeholder="ai_sanatcisi"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-white"
            >
              E-posta
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 backdrop-blur-xl"
              placeholder="ornek@email.com"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-white"
            >
              Şifre
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400 focus-visible:ring-cyan-500 focus-visible:border-cyan-500 backdrop-blur-xl"
              placeholder="En az 8 karakter"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="mt-2 w-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-sm font-semibold shadow-[0_0_30px_rgba(168,85,247,0.7)] hover:brightness-110 text-white"
            disabled={loading}
          >
            {loading ? "Hesap oluşturuluyor..." : "Hemen Başla"}
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-white/70">
          Zaten hesabın var mı?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            Giriş Yap
          </Link>
        </div>
      </div>
    </div>
  )
}


