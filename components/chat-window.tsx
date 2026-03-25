"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Send, Check, CheckCheck, Paperclip, X } from "lucide-react"
import { sendMessage, markConversationAsRead } from "@/app/actions/message"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  content: string
  attachmentUrl?: string | null
  attachmentType?: string | null
  createdAt: string
  read: boolean
  sender: {
    id: string
    username: string
    fullName: string
    avatarUrl: string | null
  }
}

interface ChatWindowProps {
  conversationId: string
  otherUser: {
    id: string
    username: string
    fullName: string
    avatarUrl: string | null
  }
  initialMessages: Message[]
  currentUserId: string
}

export function ChatWindow({
  conversationId,
  otherUser,
  initialMessages,
  currentUserId,
}: ChatWindowProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [inputValue, setInputValue] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sohbet açıldığında otomatik olarak okundu işaretle
  useEffect(() => {
    const markAsRead = async () => {
      await markConversationAsRead(conversationId)
    }
    markAsRead()
  }, [conversationId])

  // Mesajlar değiştiğinde en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Textarea otomatik yükseklik ayarı
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`
    }
  }, [inputValue])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Dosya tipini kontrol et
    const isImage = file.type.startsWith("image/")
    if (!isImage) {
      alert(
        "Sadece resim dosyaları destekleniyor.\n\nDesteklenen formatlar: JPG, PNG, GIF, WebP, SVG\nMaksimum boyut: 10MB",
      )
      return
    }

    // Dosya boyutunu kontrol et (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      alert(
        `Dosya boyutu çok büyük!\n\nSeçilen dosya: ${fileSizeMB}MB\nMaksimum boyut: 10MB\n\nLütfen daha küçük bir dosya seçin.`,
      )
      return
    }

    setSelectedFile(file)

    // Preview oluştur
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSend = async () => {
    if ((!inputValue.trim() && !selectedFile) || isPending || uploadingFile) return

    const content = inputValue.trim()
    let attachmentUrl: string | null = null
    let attachmentType: string | null = null

    setIsPending(true)

    // Dosya varsa önce yükle
    if (selectedFile) {
      try {
        setUploadingFile(true)
        
        // FormData oluştur
        const formData = new FormData()
        formData.append("file", selectedFile)
        formData.append("conversationId", conversationId)

        // API route'a gönder
        const response = await fetch("/api/upload-chat-attachment", {
          method: "POST",
          body: formData,
        })

        const uploadResult = await response.json()

        if (!response.ok || uploadResult.error) {
          console.error("Dosya yükleme hatası:", uploadResult.error)
          const errorMessage =
            uploadResult.error ||
            "Dosya yüklenemedi. Lütfen dosya boyutunu veya formatı kontrol edin.\n\nDesteklenen formatlar: JPG, PNG, GIF, WebP, SVG\nMaksimum boyut: 10MB"
          alert(errorMessage)
          setIsPending(false)
          setUploadingFile(false)
          return
        }

        attachmentUrl = uploadResult.url
        attachmentType = selectedFile.type.startsWith("image/") ? "image" : "file"
        setUploadingFile(false)
      } catch (error) {
        console.error("Dosya yükleme hatası:", error)
        alert(
          "Dosya yüklenemedi. Lütfen dosya boyutunu veya formatı kontrol edin.\n\nDesteklenen formatlar: JPG, PNG, GIF, WebP, SVG\nMaksimum boyut: 10MB",
        )
        setIsPending(false)
        setUploadingFile(false)
        return
      }
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const newMessage: Message = {
      id: tempId,
      content,
      attachmentUrl,
      attachmentType,
      createdAt: new Date().toISOString(),
      read: false,
      sender: {
        id: currentUserId,
        username: "",
        fullName: "",
        avatarUrl: null,
      },
    }

    setMessages((prev) => [...prev, newMessage])
    setInputValue("")
    setSelectedFile(null)
    setPreviewUrl(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    try {
      const result = await sendMessage(
        conversationId,
        content,
        attachmentUrl,
        attachmentType,
      )
      if (result.error) {
        // Hata durumunda geri al
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        alert(result.error)
      } else {
        // Mesajları yeniden yükle (gerçek ID ile)
        const response = await fetch(`/api/messages?conversationId=${conversationId}`)
        if (response.ok) {
          const data = await response.json()
          setMessages(data.messages)
          await markConversationAsRead(conversationId)
        }
      }
    } catch (error) {
      // Hata durumunda geri al
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      alert("Mesaj gönderilirken bir hata oluştu.")
    } finally {
      setIsPending(false)
      setUploadingFile(false)
    }
  }


  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 h-16 px-4 border-b border-border bg-background/80 backdrop-blur">
        {otherUser.avatarUrl ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image
              src={otherUser.avatarUrl}
              alt={otherUser.username}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
            {(otherUser.fullName || otherUser.username).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="font-semibold text-foreground">
            {otherUser.fullName || otherUser.username}
          </p>
          <p className="text-xs text-muted-foreground">@{otherUser.username}</p>
        </div>
      </div>

      {/* Mesaj Alanı */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-background"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">
              Henüz mesaj yok. İlk mesajı sen gönder!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isMine = message.sender.id === currentUserId

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  isMine ? "justify-end" : "justify-start",
                )}
              >
                {!isMine && (
                  <div className="flex-shrink-0">
                    {message.sender.avatarUrl ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-full">
                        <Image
                          src={message.sender.avatarUrl}
                          alt={message.sender.username}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
                        {(message.sender.fullName || message.sender.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[70%] rounded-lg px-4 py-2.5",
                    isMine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  {/* Attachment (Image) */}
                  {message.attachmentType === "image" && message.attachmentUrl && (
                    <div className="mb-2 rounded-md overflow-hidden border border-border/20">
                      <Image
                        src={message.attachmentUrl}
                        alt="Mesaj eki"
                        width={400}
                        height={300}
                        className="w-full h-auto max-w-sm object-cover cursor-pointer"
                        onClick={() => window.open(message.attachmentUrl!, "_blank")}
                        unoptimized={message.attachmentUrl.startsWith("http")}
                      />
                    </div>
                  )}

                  {/* Content */}
                  {message.content && (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                    {isMine && (
                      <div className="flex items-center">
                        {message.read ? (
                          <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                        ) : (
                          <Check className="h-3 w-3 text-primary-foreground/50" />
                        )}
                      </div>
                    )}
                    <p
                      className={cn(
                        "text-xs",
                        isMine ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Alanı */}
      <div className="p-4 border-t border-border bg-background">
        {/* File Preview */}
        {previewUrl && selectedFile && (
          <div className="mb-3 relative inline-block">
            <div className="relative rounded-md overflow-hidden border border-border max-w-xs">
              <Image
                src={previewUrl}
                alt="Preview"
                width={200}
                height={200}
                className="w-full h-auto max-h-48 object-cover"
              />
              <button
                onClick={handleRemoveFile}
                className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background transition-colors"
                title="Kaldır"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0"
            title="Resim Ekle"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || uploadingFile}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            ref={textareaRef}
            placeholder="Mesaj yazın..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isPending || uploadingFile}
            className="flex-1 min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={(!inputValue.trim() && !selectedFile) || isPending || uploadingFile}
            className="flex-shrink-0"
          >
            {uploadingFile ? (
              <span className="text-xs">Yükleniyor...</span>
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}


