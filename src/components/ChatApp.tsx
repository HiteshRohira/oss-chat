import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { AppSidebar } from "./Sidebar";
import { ChatInterface } from "./ChatInterface";
import { SignOutButton } from "../SignOutButton";

export function ChatApp() {
  const [selectedChatId, setSelectedChatId] = useState<Id<"chats"> | null>(
    null,
  );

  const user = useQuery(api.auth.loggedInUser);
  const chats = useQuery(api.chats.listChats);

  return (
    <div className="flex h-screen min-w-full">
      {/* Sidebar */}
      {/* <div
        className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 overflow-hidden`}
      > */}
      <AppSidebar
        chats={chats || []}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        onNewChat={() => setSelectedChatId(null)}
      />
      {/* </div> */}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full">
        {/* Chat Interface */}
        <div className="flex-1 overflow-hidden bg-background">
          <ChatInterface
            chatId={selectedChatId}
            onChatCreated={setSelectedChatId}
          />
        </div>
      </div>
    </div>
  );
}
