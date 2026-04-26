import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAuthHeaders, getApiUrl } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { WorkoutPostCard, isAutoWorkoutPost, getWorkoutSummary } from "@/components/WorkoutPostCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  Heart,
  MessageCircle,
  Trash2,
  ImagePlus,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Share2,
} from "lucide-react";
import { SiWhatsapp, SiFacebook, SiX as SiXIcon, SiTiktok } from "react-icons/si";

// Public App Store / Play Store fallback link the share buttons route to. We
// link to the iOS App Store listing (the canonical "get the app" surface);
// the marketing site at fayaflex.com also redirects native visitors to the
// correct store.
const APP_STORE_URL = "https://apps.apple.com/us/app/fayaflex/id6757204288";

interface FeedUser {
  id: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  avatarId?: string | null;
}

interface FeedPost {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  user: FeedUser;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

interface FeedComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: FeedUser;
}

function displayName(u: FeedUser) {
  if (u.firstName || u.lastName) return [u.firstName, u.lastName].filter(Boolean).join(" ");
  return u.username;
}

// ── Individual post card ────────────────────────────────────────────────────

function FeedCard({ post, currentUserId, isTopBurner }: { post: FeedPost; currentUserId: string; isTopBurner?: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: comments = [], isLoading: loadingComments } = useQuery<FeedComment[]>({
    queryKey: ["/api/feed/posts", post.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/feed/posts/${post.id}/comments`).then((r) => r.json()),
    enabled: showComments,
  });

  const likeMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/feed/posts/${post.id}/like`).then((r) => r.json()),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["/api/feed"] });
      const prev = qc.getQueryData<FeedPost[]>(["/api/feed"]);
      qc.setQueryData<FeedPost[]>(["/api/feed"], (old) =>
        (old ?? []).map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likeCount + (p.likedByMe ? -1 : 1) }
            : p
        )
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["/api/feed"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["/api/feed"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/feed/posts/${post.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/feed"] }),
    onError: () => toast({ title: "Could not delete post", variant: "destructive" }),
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      apiRequest("POST", `/api/feed/posts/${post.id}/comments`, { content }).then((r) => r.json()),
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["/api/feed/posts", post.id, "comments"] });
      qc.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => toast({ title: "Could not add comment", variant: "destructive" }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      apiRequest("DELETE", `/api/feed/posts/${post.id}/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/feed/posts", post.id, "comments"] });
      qc.invalidateQueries({ queryKey: ["/api/feed"] });
    },
  });

  const handleComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    addCommentMutation.mutate(trimmed);
  };

  const openComments = () => {
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 150);
  };

  // Share helpers — only rendered for auto-generated workout posts owned by
  // the current user. Every share routes recipients to the App Store via the
  // APP_STORE_URL link.
  const isOwner = post.userId === currentUserId;
  const isWorkout = isAutoWorkoutPost(post.content);
  const canShare = isOwner && isWorkout;

  // Ref to the wrapper around the rendered workout card — we screenshot this
  // element (using html-to-image) so the share sheet attaches an actual
  // visual of the workout, not just text.
  const cardCaptureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const buildWorkoutShareText = useCallback(() => {
    const summary = getWorkoutSummary(post.content);
    const tail = `Tap the link to join me on FayaFlex: ${APP_STORE_URL}`;
    return summary ? `${summary}\n\n${tail}` : `Just crushed a workout on FayaFlex!\n\n${tail}`;
  }, [post.content]);

  const captureCardAsFile = useCallback(async (): Promise<File | null> => {
    if (!cardCaptureRef.current) return null;
    const { toPng } = await import("html-to-image");
    // Use the page's actual background so the screenshot looks consistent
    // in both light and dark mode.
    const bg =
      getComputedStyle(document.body).backgroundColor &&
      getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)"
        ? getComputedStyle(document.body).backgroundColor
        : "#ffffff";
    const dataUrl = await toPng(cardCaptureRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: bg,
    });
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], "fayaflex-workout.png", { type: "image/png" });
  }, []);

  // Primary share path: capture the workout card as an image and hand it to
  // the OS-native share sheet (mobile) so users can post the visual to any
  // app — WhatsApp, Instagram, Messages, etc. Falls back to text-only share
  // when the platform can't accept files.
  const shareWorkoutWithImage = async () => {
    setIsCapturing(true);
    try {
      const text = buildWorkoutShareText();
      const file = await captureCardAsFile().catch((err) => {
        console.warn("[Share] image capture failed, falling back to text", err);
        return null;
      });

      const nav = navigator as any;
      // Best path: native share with the image file attached.
      if (file && nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({
            title: "My FayaFlex workout",
            text,
            files: [file],
          });
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return; // user dismissed sheet
          console.warn("[Share] native file share failed, trying text-only", err);
        }
      }

      // Next best: native share without image.
      if (nav.share) {
        try {
          await nav.share({ title: "My FayaFlex workout", text, url: APP_STORE_URL });
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
          console.warn("[Share] native text share failed, trying clipboard", err);
        }
      }

      // Last resort on desktop: copy to clipboard.
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: "Paste it anywhere to share." });
      } catch {
        toast({
          title: "Sharing not supported here",
          description: "Try one of the quick-link buttons below instead.",
          variant: "destructive",
        });
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Try the native share sheet (with the workout card image attached) first —
  // on mobile this lets the user pick WhatsApp / IG / Messages and the image
  // travels with the message. Returns true if the native share fired (or the
  // user cancelled it), false if we should fall back to the platform URL.
  const tryNativeImageShare = async (): Promise<boolean> => {
    const nav = navigator as any;
    if (!nav.share || !nav.canShare) return false;
    setIsCapturing(true);
    try {
      const text = buildWorkoutShareText();
      const file = await captureCardAsFile().catch((err) => {
        console.warn("[Share] image capture failed", err);
        return null;
      });
      if (file && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ title: "My FayaFlex workout", text, files: [file] });
          return true;
        } catch (err: any) {
          if (err?.name === "AbortError") return true; // user dismissed
          console.warn("[Share] native file share failed", err);
        }
      }
      return false;
    } finally {
      setIsCapturing(false);
    }
  };

  const shareWorkoutWhatsApp = async () => {
    if (await tryNativeImageShare()) return;
    // Desktop fallback: WhatsApp web intent (text only).
    window.open(`https://wa.me/?text=${encodeURIComponent(buildWorkoutShareText())}`, "_blank", "noopener,noreferrer");
  };
  const shareWorkoutFacebook = async () => {
    if (await tryNativeImageShare()) return;
    const quote = getWorkoutSummary(post.content) || "Just crushed a workout on FayaFlex!";
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_STORE_URL)}&quote=${encodeURIComponent(quote)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  const shareWorkoutX = async () => {
    if (await tryNativeImageShare()) return;
    const text = getWorkoutSummary(post.content) || "Just crushed a workout on FayaFlex!";
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(APP_STORE_URL)}&text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  const shareWorkoutTikTok = async () => {
    if (await tryNativeImageShare()) return;
    // Desktop fallback: TikTok has no public web share intent — copy the App
    // Store link so the user can drop it in their bio, comment, or DM, then
    // open TikTok.
    navigator.clipboard.writeText(`${getWorkoutSummary(post.content)}\n${APP_STORE_URL}`).catch(() => {});
    toast({
      title: "Link copied!",
      description: "Paste it into your TikTok bio, comment, or DM.",
    });
    window.open("https://www.tiktok.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      className="overflow-visible [&>img]:rounded-none"
      data-testid={`feed-card-${post.id}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <UserAvatar user={post.user} className="h-10 w-10" />
          <div>
            <p className="font-semibold text-sm leading-tight">{displayName(post.user)}</p>
            <p className="text-xs text-muted-foreground">
              @{post.user.username} &middot;{" "}
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        {post.userId === currentUserId && (
          <Button
            size="icon"
            variant="ghost"
            data-testid={`button-delete-post-${post.id}`}
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post attachment"
          className="w-full object-cover max-h-96"
          data-testid={`img-feed-${post.id}`}
        />
      )}

      {/* Content */}
      <div ref={cardCaptureRef} className="px-4 py-3">
        <WorkoutPostCard content={post.content} isTopBurner={isTopBurner} />
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-1 px-3 py-2">
        <Button
          variant="ghost"
          size="icon"
          data-testid={`button-like-${post.id}`}
          onClick={() => likeMutation.mutate()}
          disabled={likeMutation.isPending}
        >
          <Heart
            className={`h-5 w-5 transition-colors ${post.likedByMe ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
          />
        </Button>
        <LikersPopover postId={post.id} count={post.likeCount} />

        <Button
          variant="ghost"
          size="sm"
          data-testid={`button-comments-${post.id}`}
          onClick={() => (showComments ? setShowComments(false) : openComments())}
          className="flex items-center gap-1.5 px-2"
        >
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm tabular-nums">{post.commentCount}</span>
          {showComments ? (
            <ChevronUp className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>

        {canShare && (
          <div className="ml-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 px-2"
                  data-testid={`button-share-workout-${post.id}`}
                >
                  <Share2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Share</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  Share your workout card image. Friends who tap the link in
                  the message will be invited to join you on FayaFlex.
                </p>
                <Button
                  onClick={shareWorkoutWithImage}
                  size="sm"
                  className="w-full"
                  disabled={isCapturing}
                  data-testid={`button-share-workout-image-${post.id}`}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isCapturing ? "Preparing image…" : "Share workout image"}
                </Button>
                <div className="my-3 flex items-center gap-2">
                  <Separator className="flex-1" />
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    Quick links
                  </span>
                  <Separator className="flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={shareWorkoutWhatsApp}
                    variant="outline"
                    size="sm"
                    data-testid={`button-share-workout-whatsapp-${post.id}`}
                  >
                    <SiWhatsapp className="h-4 w-4 mr-2 text-green-600" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={shareWorkoutFacebook}
                    variant="outline"
                    size="sm"
                    data-testid={`button-share-workout-facebook-${post.id}`}
                  >
                    <SiFacebook className="h-4 w-4 mr-2 text-blue-600" />
                    Facebook
                  </Button>
                  <Button
                    onClick={shareWorkoutX}
                    variant="outline"
                    size="sm"
                    data-testid={`button-share-workout-x-${post.id}`}
                  >
                    <SiXIcon className="h-4 w-4 mr-2" />
                    X
                  </Button>
                  <Button
                    onClick={shareWorkoutTikTok}
                    variant="outline"
                    size="sm"
                    data-testid={`button-share-workout-tiktok-${post.id}`}
                  >
                    <SiTiktok className="h-4 w-4 mr-2" />
                    TikTok
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 leading-snug">
                  Quick links share text only. Use “Share workout image” to
                  attach the card to a post or message.
                </p>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border">
          {/* Comment input */}
          <div className="flex gap-2 p-3">
            <Textarea
              ref={commentInputRef}
              placeholder="Add a comment…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleComment();
                }
              }}
              rows={1}
              // text-base (16px) prevents iOS Safari from auto-zooming the
              // viewport when the textarea is focused. Smaller font sizes
              // trigger a zoom-in that the user then can't easily reverse.
              className="resize-none text-base min-h-0"
              data-testid={`input-comment-${post.id}`}
            />
            <Button
              size="icon"
              onClick={handleComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
              data-testid={`button-submit-comment-${post.id}`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Comment list */}
          {loadingComments ? (
            <div className="px-4 pb-3 text-xs text-muted-foreground">Loading comments…</div>
          ) : comments.length === 0 ? (
            <div className="px-4 pb-3 text-xs text-muted-foreground">No comments yet. Be the first!</div>
          ) : (
            <div className="space-y-3 px-4 pb-4">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-2" data-testid={`comment-${c.id}`}>
                  <UserAvatar user={c.user} className="h-7 w-7 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{displayName(c.user)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-0.5 break-words">{c.content}</p>
                  </div>
                  {c.userId === currentUserId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 shrink-0"
                      onClick={() => deleteCommentMutation.mutate(c.id)}
                      data-testid={`button-delete-comment-${c.id}`}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Compose box ─────────────────────────────────────────────────────────────

function ComposeBox({ currentUser }: { currentUser: any }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  const createMutation = useMutation({
    mutationFn: async ({ content, imageUrl }: { content: string; imageUrl?: string | null }) =>
      apiRequest("POST", "/api/feed/posts", { content, imageUrl }).then((r) => r.json()),
    onSuccess: () => {
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      // Dismiss the keyboard on mobile so the viewport restores correctly
      composeRef.current?.blur();
      qc.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => toast({ title: "Could not create post", variant: "destructive" }),
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed && !imageFile) return;

    let imageUrl: string | null = null;

    if (imageFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", imageFile);
        // Use getApiUrl so native apps hit https://fayaflex.com; include the
        // JWT Bearer token via getAuthHeaders() so the request isn't rejected
        // with 401 on native platforms (which don't send session cookies).
        const res = await fetch(getApiUrl("/api/upload/feed-image"), {
          method: "POST",
          body: formData,
          credentials: "include",
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || `Upload failed: ${res.status}`);
        }
        const data = await res.json();
        imageUrl = data.url ?? null;
      } catch (err: any) {
        toast({ title: "Image upload failed", description: err.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    createMutation.mutate({ content: trimmed, imageUrl });
  };

  const isBusy = uploading || createMutation.isPending;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <UserAvatar user={currentUser} className="h-10 w-10" />
        <div className="flex-1 min-w-0">
          <Textarea
            ref={composeRef}
            placeholder="Share an achievement, workout, or update…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            data-testid="input-compose"
          />
        </div>
      </div>

      {imagePreview && (
        <div className="relative">
          <img src={imagePreview} alt="Preview" className="rounded-md w-full max-h-60 object-cover" />
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={removeImage}
            data-testid="button-remove-image"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          data-testid="button-attach-image"
          className="flex items-center gap-1.5"
        >
          <ImagePlus className="h-4 w-4" />
          <span>Photo</span>
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
          data-testid="input-file-feed"
        />
        <Button
          onClick={handlePost}
          disabled={(!content.trim() && !imageFile) || isBusy}
          data-testid="button-post"
          size="sm"
        >
          {isBusy ? "Posting…" : "Post"}
        </Button>
      </div>
    </Card>
  );
}

// ── Likers popover ──────────────────────────────────────────────────────────

function LikersPopover({ postId, count }: { postId: string; count: number }) {
  const [open, setOpen] = useState(false);
  const { data: likers, isLoading } = useQuery<FeedUser[]>({
    queryKey: ["/api/feed/posts", postId, "likers"],
    queryFn: () => apiRequest("GET", `/api/feed/posts/${postId}/likers`).then((r) => r.json()),
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={count === 0}
          data-testid={`button-likers-${postId}`}
          className="px-2 -ml-1"
        >
          <span className="text-sm tabular-nums">{count}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="text-xs font-semibold text-muted-foreground px-3 py-1">
          Liked by
        </div>
        {isLoading ? (
          <div className="text-sm text-muted-foreground p-2">Loading…</div>
        ) : !likers || likers.length === 0 ? (
          <div className="text-sm text-muted-foreground p-2">No one yet</div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {likers.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover-elevate"
                data-testid={`liker-${postId}-${u.id}`}
              >
                <UserAvatar user={u} className="h-8 w-8" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{displayName(u)}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ForYou() {
  const { user } = useAuth();

  const { data: posts = [], isLoading } = useQuery<FeedPost[]>({
    queryKey: ["/api/feed"],
    queryFn: () => apiRequest("GET", "/api/feed").then((r) => r.json()),
    refetchInterval: 30_000,
  });

  // Show the latest 6 posts by default and reveal older ones in batches of 6
  // when the user taps "Show more" — keeps the initial feed light.
  const [visibleCount, setVisibleCount] = useState(6);

  // Identify the post with the highest burned-calorie count in the visible feed
  // so we can render a dramatically larger flame on it (dopamine + engagement).
  const topBurnerPostId = (() => {
    const calRe = /(\d+)\s*cal/i;
    let maxCal = 0;
    let id: string | null = null;
    for (const p of posts) {
      const m = p.content?.match(calRe);
      if (!m) continue;
      const cal = parseInt(m[1], 10);
      if (!Number.isFinite(cal)) continue;
      if (cal > maxCal) { maxCal = cal; id = p.id; }
    }
    // Only celebrate if the leader actually burned something noteworthy.
    return maxCal >= 50 ? id : null;
  })();

  if (!user) return null;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
        <h1 className="text-xl font-bold tracking-tight">For You</h1>
        <p className="text-xs text-muted-foreground">Your team's fitness feed</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Compose */}
        <ComposeBox currentUser={user} />

        {/* Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-32 rounded bg-muted" />
                    <div className="h-2.5 w-20 rounded bg-muted" />
                  </div>
                </div>
                <div className="h-4 w-full rounded bg-muted mb-2" />
                <div className="h-4 w-2/3 rounded bg-muted" />
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-medium">Nothing here yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Be the first to share a workout update with your team!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.slice(0, visibleCount).map((post) => (
              <FeedCard
                key={post.id}
                post={post}
                currentUserId={user.id}
                isTopBurner={post.id === topBurnerPostId}
              />
            ))}
            {posts.length > visibleCount && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleCount((c) => c + 6)}
                  data-testid="button-show-more-feed"
                >
                  Show more
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
