import type { Metadata } from "next"
import "../globals.css"

export const metadata: Metadata = {
  title: "Promptland - Giriş",
  description: "Promptland hesabınıza giriş yapın veya yeni bir hesap oluşturun.",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Arka plan ışık efektleri */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-fuchsia-500/30 blur-3xl" />
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-violet-600/30 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* İçerik */}
      <div className="relative z-10 flex w-full max-w-md px-4 py-10">
        {children}
      </div>
    </div>
  )
}


