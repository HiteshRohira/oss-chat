import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ModelSelector } from "./ModelSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { PlusCircle } from "lucide-react";

interface NewChatDialogProps {
  onChatCreated?: (chatId: Id<"chats">) => void;
  trigger?: React.ReactNode;
}

export function NewChatDialog({ onChatCreated, trigger }: NewChatDialogProps) {
  const [open, setOpen] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [isLoading, setIsLoading] = useState(false);

  const createChat = useMutation(api.chats.createChat);

  const handleCreateChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatTitle.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const chatId = await createChat({
        title: newChatTitle,
        model: selectedModel,
        provider: selectedProvider,
      });

      setNewChatTitle("");
      setOpen(false);
      onChatCreated?.(chatId);
    } catch (error) {
      console.error("Failed to create chat:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset form when closing
        setNewChatTitle("");
        setSelectedModel("gpt-4o-mini");
        setSelectedProvider("openai");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full">
            <PlusCircle />
            New Chat
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
          <DialogDescription>
            Create a new chat conversation. Choose your preferred AI model and
            provider.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateChat} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chat-title">Chat Title</Label>
            <Input
              id="chat-title"
              type="text"
              placeholder="Enter a title for your chat..."
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <ModelSelector
            selectedModel={selectedModel}
            selectedProvider={selectedProvider}
            onModelChange={setSelectedModel}
            onProviderChange={setSelectedProvider}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!newChatTitle.trim() || isLoading}>
              {isLoading ? "Creating..." : "Create Chat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
