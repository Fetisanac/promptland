import { CommentItem } from "./comment-item"

interface CommentListProps {
  comments: Array<{
    id: string
    content: string
    imageUrl: string | null
    createdAt: Date
    user: {
      username: string
      avatarUrl: string | null
    }
    isLiked: boolean
    _count: {
      commentLikes: number
    }
  }>
}

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Henüz yorum yok. İlk yorumu sen yap!
      </div>
    )
  }

  return (
    <div>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </div>
  )
}









