import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ShareChatModalProps {
  chatId: Id<"chats">;
  isShared?: boolean;
  shareToken?: string;
  onClose: () => void;
}

export function ShareChatModal({ chatId, isShared, shareToken, onClose }: ShareChatModalProps) {
  const [copied, setCopied] = useState(false);
  
  const shareChat = useMutation(api.chats.shareChat);
  const unshareChat = useMutation(api.chats.unshareChat);

  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : "";

  const handleShare = async () => {
    try {
      const token = await shareChat({ chatId });
      // The component will re-render with the new share token
    } catch (error) {
      console.error("Failed to share chat:", error);
    }
  };

  const handleUnshare = async () => {
    try {
      await unshareChat({ chatId });
    } catch (error) {
      console.error("Failed to unshare chat:", error);
    }
  };

  const handleCopyLink = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Share Chat</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isShared ? (
          <div className="space-y-4">
            <p className="text-gray-600">
              Share this chat with others by creating a public link. Anyone with the link will be able to view the conversation.
            </p>
            <button
              onClick={handleShare}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Share Link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              This chat is currently shared. Anyone with the link below can view the conversation.
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Copy link"
              >
                {copied ? (
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            <button
              onClick={handleUnshare}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Stop Sharing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
