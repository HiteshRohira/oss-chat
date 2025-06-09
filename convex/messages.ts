import { v } from "convex/values";
import { mutation, action, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";

export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    isStreaming: v.optional(v.boolean()),
    streamingComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db.get(args.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    return await ctx.db.insert("messages", {
      chatId: args.chatId,
      role: args.role,
      content: args.content,
      model: args.model,
      provider: args.provider,
      isStreaming: args.isStreaming,
      streamingComplete: args.streamingComplete,
    });
  },
});

export const updateMessageContent = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    isStreaming: v.optional(v.boolean()),
    streamingComplete: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.patch(args.messageId, {
      content: args.content,
      isStreaming: args.isStreaming,
      streamingComplete: args.streamingComplete,
    });
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    newContent: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    // Store original content if not already edited
    const originalContent = message.isEdited ? message.originalContent : message.content;

    await ctx.db.patch(args.messageId, {
      content: args.newContent,
      isEdited: true,
      originalContent,
    });

    return args.messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.messageId);
  },
});

export const sendMessage = action({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    // Add user message
    await ctx.runMutation(api.messages.addMessage, {
      chatId: args.chatId,
      role: "user",
      content: args.content,
    });

    // Get chat details to know which model to use
    const chat = await ctx.runQuery(api.chats.getChat, { chatId: args.chatId });
    
    // Get conversation history
    const messages = await ctx.runQuery(api.chats.getChatMessages, { chatId: args.chatId });
    
    // Create initial assistant message for streaming
    const assistantMessageId = await ctx.runMutation(api.messages.addMessage, {
      chatId: args.chatId,
      role: "assistant",
      content: "",
      model: chat.model,
      provider: chat.provider,
      isStreaming: true,
      streamingComplete: false,
    });

    // Start streaming response
    await ctx.runAction(internal.ai.generateStreamingResponse, {
      messageId: assistantMessageId,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      model: chat.model,
      provider: chat.provider,
    });

    return "Streaming started";
  },
});

export const retryMessage = action({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.runQuery(api.messages.getMessage, { messageId: args.messageId });
    if (!message || message.role !== "assistant") {
      throw new Error("Can only retry assistant messages");
    }

    const chat = await ctx.runQuery(api.chats.getChat, { chatId: message.chatId });
    
    // Get conversation history up to this message
    const allMessages = await ctx.runQuery(api.chats.getChatMessages, { chatId: message.chatId });
    const messageIndex = allMessages.findIndex(m => m._id === args.messageId);
    const conversationHistory = allMessages.slice(0, messageIndex);

    // Reset the message content and start streaming
    await ctx.runMutation(api.messages.updateMessageContent, {
      messageId: args.messageId,
      content: "",
      isStreaming: true,
      streamingComplete: false,
    });

    // Start streaming response
    await ctx.runAction(internal.ai.generateStreamingResponse, {
      messageId: args.messageId,
      messages: conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
      model: chat.model,
      provider: chat.provider,
    });

    return "Retry started";
  },
});

export const getMessage = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    return message;
  },
});
