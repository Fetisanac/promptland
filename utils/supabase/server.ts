import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Cookie'ler sadece Server Action veya Route Handler içinde değiştirilebilir
            // Okuma işlemleri için bu hata normaldir, sessizce devam et
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: "", ...options })
          } catch (error) {
            // Cookie'ler sadece Server Action veya Route Handler içinde değiştirilebilir
            // Okuma işlemleri için bu hata normaldir, sessizce devam et
          }
        },
      },
    },
  )
}

/**
 * Service role key ile admin client oluşturur (RLS bypass)
 * SADECE server-side'da kullanılmalı, asla client'a expose edilmemeli!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY environment variable is not set. Please add it to your .env.local file."
    )
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}






