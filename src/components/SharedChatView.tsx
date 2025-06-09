import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams } from "react-router-dom";

export function SharedChatView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  
  const chat = useQuery(api.chats.getSharedChat, shareToken ? { shareToken } : "skip");
  const messages = useQuery(api.chats.getSharedChatMessages, shareToken ? { shareToken } : "skip");

  if (!shareToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Share Link</h1>
          <p className="text-gray-600">The share link you're trying to access is invalid.</p>
        </div>
      </div>
    );
  }

  if (chat === undefined || messages === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (chat === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Not Found</h1>
          <p className="text-gray-600">This shared chat is no longer available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{chat.title}</h1>
            <p className="text-sm text-gray-500">
              Shared chat • {chat.provider} • {chat.model}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Read-only view
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>This chat has no messages yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.isEdited && (
                      <div className="text-xs opacity-70 mt-1">
                        (edited)
                      </div>
                    )}
                    {msg.role === "assistant" && msg.model && (
                      <div className="text-xs opacity-70 mt-1">
                        {msg.provider} • {msg.model}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
