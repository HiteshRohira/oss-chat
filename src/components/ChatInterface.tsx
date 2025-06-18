import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { MessageActions } from "./MessageActions";
import { ShareChatModal } from "./ShareChatModal";
import { NewChatDialog } from "./NewChatDialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ArrowUp, LoaderCircle, Share } from "lucide-react";

interface ChatInterfaceProps {
  chatId: Id<"chats"> | null;
  onChatCreated: (chatId: Id<"chats">) => void;
}

export function ChatInterface({ chatId, onChatCreated }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editingMessageId, setEditingMessageId] =
    useState<Id<"messages"> | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chat = useQuery(api.chats.getChat, chatId ? { chatId } : "skip");
  const messages = useQuery(
    api.chats.getChatMessages,
    chatId ? { chatId } : "skip",
  );

  const editMessage = useMutation(api.messages.editMessage);
  const sendMessage = useAction(api.messages.sendMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if any message is currently streaming
  const isStreaming = messages?.some((msg) => msg.isStreaming) || false;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chatId || isLoading || isStreaming) return;

    const messageText = message;
    setMessage("");
    setIsLoading(true);

    try {
      await sendMessage({
        chatId,
        content: messageText,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessage(messageText); // Restore message on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMessage = async (
    messageId: Id<"messages">,
    newContent: string,
  ) => {
    try {
      await editMessage({ messageId, newContent });
      setEditingMessageId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Failed to edit message:", error);
    }
  };

  const startEditing = (messageId: Id<"messages">, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  if (!chatId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Welcome to OSS Chat</h2>
          <p className="text-muted-foreground mb-6">
            Start a new conversation by clicking the "New Chat" button in the
            sidebar.
          </p>
          <NewChatDialog onChatCreated={onChatCreated} />
        </div>
      </div>
    );
  }

  if (!chat || !messages) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{chat.title}</h2>
          <p className="text-sm text-muted-foreground">
            {chat.provider} • {chat.model}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowShareModal(true)}
        >
          <Share className="w-4 h-4" />
          Share
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 relative group ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {editingMessageId === msg._id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full resize-none"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleEditMessage(msg._id, editingContent)
                        }
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.isEdited && (
                      <div className="text-xs opacity-70 mt-1">(edited)</div>
                    )}
                    {msg.role === "assistant" && (
                      <div className="flex items-center justify-between mt-1">
                        {msg.model && (
                          <div className="text-xs opacity-70">
                            {msg.provider} • {msg.model}
                          </div>
                        )}
                        {msg.isStreaming && (
                          <div className="flex items-center space-x-1 text-xs opacity-70">
                            <div className="animate-pulse w-2 h-2 bg-current rounded-full"></div>
                            <span>streaming...</span>
                          </div>
                        )}
                      </div>
                    )}

                    <MessageActions
                      messageId={msg._id}
                      role={msg.role}
                      content={msg.content}
                      isStreaming={msg.isStreaming}
                      onEdit={
                        msg.role === "user"
                          ? () => startEditing(msg._id, msg.content)
                          : undefined
                      }
                    />
                  </>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && !isStreaming && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-foreground"></div>
                <span className="text-muted-foreground">
                  Starting response...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="shadow-md rounded-lg w-2/3 mx-auto">
        <form onSubmit={handleSendMessage} className="flex gap-2 relative">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || isStreaming}
            className="h-36 p-2 focus:outline-none"
          />
          <Button
            type="submit"
            disabled={!message.trim() || isLoading || isStreaming}
            className="absolute right-2 top-2 px-3"
          >
            {isStreaming ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <ArrowUp />
            )}
          </Button>
        </form>
        {isStreaming && (
          <p className="text-xs text-muted-foreground mt-2">
            AI is generating a response...
          </p>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && chatId && (
        <ShareChatModal
          chatId={chatId}
          isShared={chat.isShared}
          shareToken={chat.shareToken}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
