"use client"

import { useState } from "react"
import { FeedCard } from "@/components/feed-card"

interface ProfileTabsProps {
  posts: any[]
  likedPosts: any[]
  savedPosts?: any[]
  showLikesTab?: boolean
  showSavedTab?: boolean
  currentUserId?: string | null
}

export function ProfileTabs({
  posts,
  likedPosts,
  savedPosts = [],
  showLikesTab = true,
  showSavedTab = false,
  currentUserId,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "likes" | "saved">("posts")

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="flex gap-6 border-b border-border px-6 pt-6 text-sm">
        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-3 font-medium transition-colors ${
            activeTab === "posts"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Paylaşımlar
        </button>
        {showLikesTab && (
          <button
            onClick={() => setActiveTab("likes")}
            className={`pb-3 font-medium transition-colors ${
              activeTab === "likes"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Beğenilenler
          </button>
        )}
        {showSavedTab && (
          <button
            onClick={() => setActiveTab("saved")}
            className={`pb-3 font-medium transition-colors ${
              activeTab === "saved"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Kaydedilenler
          </button>
        )}
      </div>

      <div className="p-6">
        {activeTab === "posts" ? (
          posts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Henüz paylaşım yok. İlk promptunu paylaş!
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((prompt) => (
                <FeedCard key={prompt.id} prompt={prompt} currentUserId={currentUserId} />
              ))}
            </div>
          )
        ) : activeTab === "likes" ? (
          likedPosts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Henüz beğenilen prompt yok.
            </div>
          ) : (
            <div className="space-y-6">
              {likedPosts.map((prompt) => (
                <FeedCard key={prompt.id} prompt={prompt} currentUserId={currentUserId} />
              ))}
            </div>
          )
        ) : (
          savedPosts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Henüz kaydedilen prompt yok.
            </div>
          ) : (
            <div className="space-y-6">
              {savedPosts.map((prompt) => (
                <FeedCard key={prompt.id} prompt={prompt} currentUserId={currentUserId} />
              ))}
            </div>
          )
        )}
      </div>
    </section>
  )
}

