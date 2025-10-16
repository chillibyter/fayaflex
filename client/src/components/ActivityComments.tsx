import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

interface ActivityCommentsProps {
  activityId: string;
}

export default function ActivityComments({ activityId }: ActivityCommentsProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  // Fetch comments
  const { data: comments = [] } = useQuery({
    queryKey: ['/api/activities', activityId, 'comments'],
    queryFn: async () => {
      const res = await fetch(`/api/activities/${activityId}/comments`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      return res.json();
    },
    enabled: showComments,
  });

  // Add comment
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/activities/${activityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to add comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities', activityId, 'comments'] });
      setCommentText("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/activities/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/activities', activityId, 'comments'] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (commentText.trim().length > 0) {
      addCommentMutation.mutate(commentText);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        data-testid={`button-toggle-comments-${activityId}`}
      >
        <MessageCircle className="h-4 w-4 mr-1" />
        <span data-testid={`count-comments-${activityId}`}>
          {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
        </span>
      </Button>

      {showComments && (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          {/* Comment input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="min-h-[60px]"
              data-testid={`input-comment-${activityId}`}
            />
            <Button
              size="sm"
              onClick={handleSubmitComment}
              disabled={addCommentMutation.isPending || commentText.trim().length === 0}
              data-testid={`button-post-comment-${activityId}`}
            >
              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>

          {/* Comments list */}
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map((comment: any) => (
                <div key={comment.id} className="flex gap-2" data-testid={`comment-${comment.id}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.user.profileImageUrl} />
                    <AvatarFallback>
                      {comment.user.firstName?.[0] || comment.user.username?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm" data-testid={`comment-author-${comment.id}`}>
                          {comment.user.firstName && comment.user.lastName
                            ? `${comment.user.firstName} ${comment.user.lastName}`
                            : comment.user.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {currentUser?.id === comment.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          data-testid={`button-delete-comment-${comment.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm" data-testid={`comment-content-${comment.id}`}>
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
