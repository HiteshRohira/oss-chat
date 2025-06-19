import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { NewChatDialog } from "./NewChatDialog";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { PlusCircle } from "lucide-react";

interface Chat {
  _id: Id<"chats">;
  title: string;
  model: string;
  provider: string;
  _creationTime: number;
}

interface SidebarProps {
  chats: Chat[];
  selectedChatId: Id<"chats"> | null;
  onSelectChat: (chatId: Id<"chats">) => void;
  onNewChat: () => void;
}

export function AppSidebar({
  chats,
  selectedChatId,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  const deleteChat = useMutation(api.chats.deleteChat);

  const handleDeleteChat = async (chatId: Id<"chats">, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteChat({ chatId });
        if (selectedChatId === chatId) {
          onNewChat();
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
  };

  return (
    <Sidebar>
      {/* Header */}
      <SidebarHeader className="flex flex-row justify-between items-center">
        <SidebarTrigger variant={"secondary"} className="h-full" />
        <NewChatDialog onChatCreated={onSelectChat} />
      </SidebarHeader>

      {/* Chat List */}
      <SidebarContent className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No chats yet. Create your first chat!
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat._id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors group relative ${
                  selectedChatId === chat._id
                    ? "bg-blue-100 border border-blue-200"
                    : "hover:bg-gray-100"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {chat.title}
                    </h3>
                  </div>

                  <button
                    onClick={(e) => handleDeleteChat(chat._id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                  >
                    <svg
                      className="w-4 h-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
