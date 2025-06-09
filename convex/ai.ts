"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { internal, api } from "./_generated/api";

export const generateResponse = internalAction({
  args: {
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
    model: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const { messages, model, provider } = args;

    try {
      if (provider === "openai") {
        return await generateOpenAIResponse(messages, model);
      } else if (provider === "google") {
        return await generateGoogleResponse(messages, model);
      } else if (provider === "openrouter") {
        return await generateOpenRouterResponse(messages, model);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error generating response with ${provider}:`, error);
      return `Sorry, I encountered an error while generating a response. Please try again.`;
    }
  },
});

export const generateStreamingResponse = internalAction({
  args: {
    messageId: v.id("messages"),
    messages: v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    })),
    model: v.string(),
    provider: v.string(),
  },
  handler: async (ctx, args) => {
    const { messageId, messages, model, provider } = args;

    try {
      if (provider === "openai") {
        await generateOpenAIStreamingResponse(ctx, messageId, messages, model);
      } else if (provider === "google") {
        await generateGoogleStreamingResponse(ctx, messageId, messages, model);
      } else if (provider === "openrouter") {
        await generateOpenRouterStreamingResponse(ctx, messageId, messages, model);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Error generating streaming response with ${provider}:`, error);
      await ctx.runMutation(api.messages.updateMessageContent, {
        messageId,
        content: `Sorry, I encountered an error while generating a response. Please try again.`,
        isStreaming: false,
        streamingComplete: true,
      });
    }
  },
});

async function generateOpenAIStreamingResponse(
  ctx: any,
  messageId: any,
  messages: Array<{role: string, content: string}>,
  model: string
) {
  const openai = new OpenAI({
    baseURL: process.env.CONVEX_OPENAI_BASE_URL || undefined,
    apiKey: process.env.CONVEX_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  });

  const stream = await openai.chat.completions.create({
    model: model,
    messages: messages as any,
    max_tokens: 1000,
    temperature: 0.7,
    stream: true,
  });

  let fullContent = "";
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullContent += content;
      
      // Update the message with accumulated content
      await ctx.runMutation(api.messages.updateMessageContent, {
        messageId,
        content: fullContent,
        isStreaming: true,
        streamingComplete: false,
      });
    }
  }

  // Mark streaming as complete
  await ctx.runMutation(api.messages.updateMessageContent, {
    messageId,
    content: fullContent,
    isStreaming: false,
    streamingComplete: true,
  });
}

async function generateGoogleStreamingResponse(
  ctx: any,
  messageId: any,
  messages: Array<{role: string, content: string}>,
  model: string
) {
  // For Google AI, we'll simulate streaming by generating the full response
  // and then "streaming" it word by word (since Google AI doesn't support streaming in the same way)
  const fullResponse = await generateGoogleResponse(messages, model);
  
  const words = fullResponse.split(' ');
  let currentContent = "";
  
  for (let i = 0; i < words.length; i++) {
    currentContent += (i > 0 ? ' ' : '') + words[i];
    
    await ctx.runMutation(api.messages.updateMessageContent, {
      messageId,
      content: currentContent,
      isStreaming: true,
      streamingComplete: false,
    });
    
    // Small delay to simulate streaming
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  // Mark streaming as complete
  await ctx.runMutation(api.messages.updateMessageContent, {
    messageId,
    content: currentContent,
    isStreaming: false,
    streamingComplete: true,
  });
}

async function generateOpenRouterStreamingResponse(
  ctx: any,
  messageId: any,
  messages: Array<{role: string, content: string}>,
  model: string
) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  let fullContent = "";
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              
              await ctx.runMutation(api.messages.updateMessageContent, {
                messageId,
                content: fullContent,
                isStreaming: true,
                streamingComplete: false,
              });
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  // Mark streaming as complete
  await ctx.runMutation(api.messages.updateMessageContent, {
    messageId,
    content: fullContent,
    isStreaming: false,
    streamingComplete: true,
  });
}

async function generateOpenAIResponse(messages: Array<{role: string, content: string}>, model: string) {
  const openai = new OpenAI({
    baseURL: process.env.CONVEX_OPENAI_BASE_URL || undefined,
    apiKey: process.env.CONVEX_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  });

  const response = await openai.chat.completions.create({
    model: model,
    messages: messages as any,
    max_tokens: 1000,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "No response generated";
}

async function generateGoogleResponse(messages: Array<{role: string, content: string}>, model: string) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("Google AI API key not configured");
  }

  // Convert messages to Google's format
  const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Google AI API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated";
}

async function generateOpenRouterResponse(messages: Array<{role: string, content: string}>, model: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${data.error?.message || 'Unknown error'}`);
  }

  return data.choices?.[0]?.message?.content || "No response generated";
}
