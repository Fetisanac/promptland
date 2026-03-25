"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"

export async function startConversation(targetUserId: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Kendine mesaj göndermeyi engelle
    if (user.id === targetUserId) {
      return { error: "Kendinize mesaj gönderemezsiniz." }
    }

    // Hedef kullanıcının var olduğunu kontrol et
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!targetUser) {
      return { error: "Kullanıcı bulunamadı." }
    }

    // İki kullanıcı arasında zaten bir conversation var mı kontrol et
    // Her iki kullanıcının da participant olduğu ve sadece 2 participant'ı olan conversation'ı bul
    const userConversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
      },
    })

    // Her iki kullanıcının da dahil olduğu ve sadece 2 participant'ı olan conversation'ı bul
    const existingConversation = userConversations.find(
      (conv) =>
        conv.participants.length === 2 &&
        conv.participants.some((p) => p.userId === user.id) &&
        conv.participants.some((p) => p.userId === targetUserId),
    )

    if (existingConversation) {
      return { conversationId: existingConversation.id }
    }

    // Yeni conversation oluştur
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: user.id },
            { userId: targetUserId },
          ],
        },
      },
    })

    return { conversationId: conversation.id }
  } catch (error) {
    console.error("Conversation başlatma hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Sohbet başlatılırken bir hata oluştu.",
    }
  }
}

export async function sendMessage(
  conversationId: string,
  content: string,
  attachmentUrl?: string | null,
  attachmentType?: string | null,
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Mesaj içeriği veya attachment olmalı
    if ((!content || content.trim().length === 0) && !attachmentUrl) {
      return { error: "Mesaj içeriği veya dosya gerekli." }
    }

    // Conversation'ın var olduğunu ve kullanıcının participant olduğunu kontrol et
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!conversation) {
      return { error: "Sohbet bulunamadı." }
    }

    const participantIds = conversation.participants.map((p) => p.userId)
    if (!participantIds.includes(user.id)) {
      return { error: "Bu sohbete erişim yetkiniz yok." }
    }

    // Mesajı oluştur ve conversation'ın updatedAt'ini güncelle
    await prisma.$transaction([
      prisma.message.create({
        data: {
          content: content.trim() || "",
          attachmentUrl: attachmentUrl || null,
          attachmentType: attachmentType || null,
          senderId: user.id,
          conversationId: conversationId,
        },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ])

    revalidatePath("/messages")
    revalidatePath(`/messages/${conversationId}`)

    return { success: true }
  } catch (error) {
    console.error("Mesaj gönderme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Mesaj gönderilirken bir hata oluştu.",
    }
  }
}

export async function getConversations() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Kullanıcının dahil olduğu conversation'ları çek
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    // Her conversation için karşı tarafı bul ve formatla
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find((p) => p.userId !== user.id)
      const lastMessage = conv.messages[0] || null

      return {
        id: conv.id,
        updatedAt: conv.updatedAt.toISOString(),
        otherUser: otherParticipant
          ? {
              id: otherParticipant.user.id,
              username: otherParticipant.user.username,
              fullName: otherParticipant.user.fullName,
              avatarUrl: otherParticipant.user.avatarUrl,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt.toISOString(),
              senderId: lastMessage.senderId,
            }
          : null,
      }
    })

    return { conversations: formattedConversations }
  } catch (error) {
    console.error("Conversation'ları getirme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Sohbetler yüklenirken bir hata oluştu.",
    }
  }
}

export async function getMessages(conversationId: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Conversation'ın var olduğunu ve kullanıcının participant olduğunu kontrol et
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!conversation) {
      return { error: "Sohbet bulunamadı." }
    }

    const participantIds = conversation.participants.map((p) => p.userId)
    if (!participantIds.includes(user.id)) {
      return { error: "Bu sohbete erişim yetkiniz yok." }
    }

    // Mesajları çek
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    // Mesajları formatla
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      attachmentUrl: msg.attachmentUrl,
      attachmentType: msg.attachmentType,
      createdAt: msg.createdAt.toISOString(),
      read: msg.read,
      sender: {
        id: msg.sender.id,
        username: msg.sender.username,
        fullName: msg.sender.fullName,
        avatarUrl: msg.sender.avatarUrl,
      },
    }))

    return { messages: formattedMessages }
  } catch (error) {
    console.error("Mesajları getirme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Mesajlar yüklenirken bir hata oluştu.",
    }
  }
}

export async function getUnreadMessageCount() {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { count: 0 }
    }

    // Kullanıcının dahil olduğu conversation'ları bul
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: user.id,
          },
        },
      },
      select: {
        id: true,
      },
    })

    const conversationIds = conversations.map((c) => c.id)

    if (conversationIds.length === 0) {
      return { count: 0 }
    }

    // Bu conversation'larda, senderId'si ben olmayan (bana gelen) ve read: false olan mesajları say
    const count = await prisma.message.count({
      where: {
        conversationId: {
          in: conversationIds,
        },
        senderId: {
          not: user.id,
        },
        read: false,
      },
    })

    return { count }
  } catch (error) {
    console.error("Okunmamış mesaj sayısı alınırken hata:", error)
    return { count: 0 }
  }
}

export async function markConversationAsRead(conversationId: string) {
  try {
    const supabase = createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: "Oturum açmanız gerekiyor." }
    }

    // Conversation'ın var olduğunu ve kullanıcının participant olduğunu kontrol et
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!conversation) {
      return { error: "Sohbet bulunamadı." }
    }

    const participantIds = conversation.participants.map((p) => p.userId)
    if (!participantIds.includes(user.id)) {
      return { error: "Bu sohbete erişim yetkiniz yok." }
    }

    // Bu sohbetteki, göndericisi ben OLMAYAN tüm mesajların read alanını true yap
    await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: {
          not: user.id,
        },
        read: false,
      },
      data: {
        read: true,
      },
    })

    revalidatePath("/messages")
    revalidatePath(`/messages/${conversationId}`)
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Conversation okundu işaretleme hatası:", error)
    return {
      error:
        error instanceof Error
          ? error.message
          : "Sohbet okundu işaretlenirken bir hata oluştu.",
    }
  }
}

