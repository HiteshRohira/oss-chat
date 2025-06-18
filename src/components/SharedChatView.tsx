import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, Share2 } from "lucide-react";
import { Markdown } from "./ui/markdown";
import { cn } from "@/lib/utils";

export function SharedChatView() {
  const { shareToken } = useParams<{ shareToken: string }>();

  const chat = useQuery(
    api.chats.getSharedChat,
    shareToken ? { shareToken } : "skip",
  );
  const messages = useQuery(
    api.chats.getSharedChatMessages,
    shareToken ? { shareToken } : "skip",
  );

  if (!shareToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Invalid Share Link
                </h1>
                <p className="text-muted-foreground mt-2">
                  The share link you're trying to access is invalid.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chat === undefined || messages === undefined) {
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="w-full mx-auto px-4 py-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <main className="max-w-4xl mx-auto p-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (chat === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Chat Not Found
                </h1>
                <p className="text-muted-foreground mt-2">
                  This shared chat is no longer available.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="w-full mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {chat.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Share2 className="h-3 w-3" />
                  Shared chat
                </Badge>
                <Badge variant="outline">{chat.provider}</Badge>
                <Badge variant="outline">{chat.model}</Badge>
              </div>
            </div>
            <Badge variant="secondary" className="text-muted-foreground">
              Read-only view
            </Badge>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="max-w-4xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            {messages.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No messages</AlertTitle>
                <AlertDescription>
                  This chat has no messages yet.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-4 py-3 space-y-2",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground ml-12"
                          : "bg-muted mr-12",
                      )}
                    >
                      <div>
                        {msg.role === "assistant" ? (
                          <Markdown>{msg.content}</Markdown>
                        ) : (
                          <div className="whitespace-pre-wrap">
                            {msg.content}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs opacity-70">
                        <div className="flex items-center gap-2">
                          {msg.isEdited && <span>(edited)</span>}
                          {msg.role === "assistant" && msg.model && (
                            <div className="flex items-center gap-1">
                              <Badge
                                variant="outline"
                                className="text-xs px-1 py-0"
                              >
                                {msg.provider}
                              </Badge>
                              <span>•</span>
                              <span>{msg.model}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
