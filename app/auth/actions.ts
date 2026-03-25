'use server'

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath("/")
  redirect("/")
}

export async function login(formData: FormData) {
  const supabase = createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Session'ı yenile ve cache'i temizle
  revalidatePath("/", "layout")
  revalidatePath("/")
  
  // Zorla yönlendirme
  redirect("/")
}

export async function signup(formData: FormData) {
  const supabase = createClient()
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const fullName = formData.get("fullName") as string
  const username = formData.get("username") as string

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        fullName,
        username,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  // Session'ı yenile ve cache'i temizle
  revalidatePath("/", "layout")
  revalidatePath("/")
  
  // Zorla yönlendirme
  redirect("/")
}

