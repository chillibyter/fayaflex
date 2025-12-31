import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday, isYesterday } from "date-fns";
import { UserAvatar } from "@/components/UserAvatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType, Message } from "@shared/schema";

interface Conversation {
  partnerId: string;
  partner: UserType | null;
  lastMessage: Message;
  unreadCount: number;
}

interface ConversationData {
  messages: Message[];
  partner: UserType | null;
}

export default function Messages() {
  const [, params] = useRoute("/messages/:partnerId");
  const partnerId = params?.partnerId;
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: currentUser } = useQuery<UserType>({
    queryKey: ['/api/auth/user'],
  });

  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/messages/conversations'],
    enabled: !partnerId,
  });

  const { data: conversationData, isLoading: loadingConversation } = useQuery<ConversationData>({
    queryKey: ['/api/messages/conversation', partnerId],
    enabled: !!partnerId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async ({ recipientId, content }: { recipientId: string; content: string }) => {
      return await apiRequest('POST', '/api/messages', { recipientId, content });
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversation', partnerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationData?.messages]);

  const formatMessageTime = (date: string | Date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return `Yesterday ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d, h:mm a');
  };

  const getUserName = (user: UserType | null) => {
    if (!user) return "Unknown";
    if (user.firstName) return user.firstName;
    if (user.username) return user.username;
    return "User";
  };

  const handleSend = () => {
    if (!partnerId || !newMessage.trim()) return;
    sendMutation.mutate({ recipientId: partnerId, content: newMessage.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (partnerId) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 pb-4 border-b mb-4">
          <Link href="/messages">
            <Button variant="ghost" size="icon" data-testid="button-back-messages">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <UserAvatar user={conversationData?.partner} className="h-10 w-10" iconClassName="h-5 w-5" />
          <div>
            <p className="font-semibold">{getUserName(conversationData?.partner)}</p>
            <p className="text-xs text-muted-foreground">Teammate</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {loadingConversation ? (
            <>
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-12 w-3/4 ml-auto" />
              <Skeleton className="h-12 w-3/4" />
            </>
          ) : conversationData?.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="font-medium">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Send a message to start the conversation
              </p>
            </div>
          ) : (
            <>
              {conversationData?.messages.map((message) => {
                const isOwn = message.senderId === currentUser?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                        isOwn
                          ? 'bg-emerald-500 text-white rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                        <span className={`text-xs ${isOwn ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                          {formatMessageTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          message.isRead ? (
                            <CheckCheck className="h-3 w-3 text-emerald-100" />
                          ) : (
                            <Check className="h-3 w-3 text-emerald-100" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
              data-testid="input-message"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600"
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
          <MessageCircle className="h-8 w-8 text-emerald-500" />
          Messages
        </h1>
        <p className="text-muted-foreground">
          Chat with your teammates
        </p>
      </div>

      <div className="space-y-2">
        {loadingConversations ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm text-muted-foreground">
                Visit a teammate's profile and tap "Message" to start chatting
              </p>
            </CardContent>
          </Card>
        ) : (
          conversations.map((conv) => (
            <Link key={conv.partnerId} href={`/messages/${conv.partnerId}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`conversation-${conv.partnerId}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <UserAvatar user={conv.partner} className="h-12 w-12" iconClassName="h-6 w-6" />
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium ${conv.unreadCount > 0 ? 'text-foreground' : ''}`}>
                          {getUserName(conv.partner)}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.lastMessage.senderId === currentUser?.id ? 'You: ' : ''}
                        {conv.lastMessage.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
