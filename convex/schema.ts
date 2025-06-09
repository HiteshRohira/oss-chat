import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  chats: defineTable({
    userId: v.id("users"),
    title: v.string(),
    model: v.string(), // "gpt-4o-mini", "gemini-pro", "openrouter/model-name"
    provider: v.string(), // "openai", "google", "openrouter"
    isShared: v.optional(v.boolean()), // Whether chat is publicly shared
    shareToken: v.optional(v.string()), // Unique token for public access
  }).index("by_user", ["userId"])
    .index("by_share_token", ["shareToken"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    isStreaming: v.optional(v.boolean()), // Track if message is still being streamed
    streamingComplete: v.optional(v.boolean()), // Track if streaming is complete
    isEdited: v.optional(v.boolean()), // Track if message was edited
    originalContent: v.optional(v.string()), // Store original content for edited messages
  }).index("by_chat", ["chatId"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    defaultModel: v.string(),
    defaultProvider: v.string(),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
