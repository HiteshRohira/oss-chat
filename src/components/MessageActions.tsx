import { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface MessageActionsProps {
  messageId: Id<"messages">;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  onEdit?: () => void;
}

export function MessageActions({ messageId, role, content, isStreaming, onEdit }: MessageActionsProps) {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const retryMessage = useAction(api.messages.retryMessage);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = async () => {
    if (role === "assistant" && !isStreaming) {
      try {
        await retryMessage({ messageId });
      } catch (error) {
        console.error("Failed to retry message:", error);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage({ messageId });
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {showActions && !isStreaming && (
        <div className="absolute -top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex gap-1 z-10">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Copy message"
          >
            {copied ? (
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {role === "user" && onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Edit message"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}

          {role === "assistant" && (
            <button
              onClick={handleRetry}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Retry message"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}

          <button
            onClick={handleDelete}
            className="p-1.5 hover:bg-red-100 rounded transition-colors"
            title="Delete message"
          >
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
