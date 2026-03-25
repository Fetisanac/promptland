import { NextRequest, NextResponse } from "next/server"
import { getMessages } from "@/app/actions/message"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId gerekli." },
        { status: 400 },
      )
    }

    const result = await getMessages(conversationId)

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ messages: result.messages })
  } catch (error) {
    console.error("Mesajlar API hatası:", error)
    return NextResponse.json(
      { error: "Mesajlar yüklenirken bir hata oluştu." },
      { status: 500 },
    )
  }
}







