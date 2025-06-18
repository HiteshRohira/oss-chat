import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ModelSelector } from "./ModelSelector";
import { MessageActions } from "./MessageActions";
import { ShareChatModal } from "./ShareChatModal";

interface ChatInterfaceProps {
  chatId: Id<"chats"> | null;
  onChatCreated: (chatId: Id<"chats">) => void;
}

export function ChatInterface({ chatId, onChatCreated }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewChatForm, setShowNewChatForm] = useState(!chatId);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [selectedProvider, setSelectedProvider] = useState("openai");
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

  const createChat = useMutation(api.chats.createChat);
  const editMessage = useMutation(api.messages.editMessage);
  const sendMessage = useAction(api.messages.sendMessage);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setShowNewChatForm(!chatId);
  }, [chatId]);

  // Check if any message is currently streaming
  const isStreaming = messages?.some((msg) => msg.isStreaming) || false;

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim()) return;

    try {
      const newChatId = await createChat({
        title: newChatTitle,
        model: selectedModel,
        provider: selectedProvider,
      });

      setNewChatTitle("");
      setShowNewChatForm(false);
      onChatCreated(newChatId);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

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

  if (showNewChatForm) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Start a New Chat
            </h2>

            <form onSubmit={handleCreateChat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Title
                </label>
                <input
                  type="text"
                  placeholder="Enter a title for your chat..."
                  value={newChatTitle}
                  onChange={(e) => setNewChatTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <ModelSelector
                selectedModel={selectedModel}
                selectedProvider={selectedProvider}
                onModelChange={setSelectedModel}
                onProviderChange={setSelectedProvider}
              />

              <button
                type="submit"
                disabled={!newChatTitle.trim()}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Create Chat
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (!chat || !messages) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{chat.title}</h2>
          <p className="text-sm text-gray-500">
            {chat.provider} • {chat.model}
          </p>
        </div>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
            />
          </svg>
          Share
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
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
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                {editingMessageId === msg._id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded resize-none text-gray-900"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleEditMessage(msg._id, editingContent)
                        }
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
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
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                <span className="text-gray-600">Starting response...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading || isStreaming}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading || isStreaming}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStreaming ? "Streaming..." : "Send"}
          </button>
        </form>
        {isStreaming && (
          <p className="text-xs text-gray-500 mt-2">
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
