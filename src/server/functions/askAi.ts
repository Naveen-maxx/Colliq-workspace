/**
 * Colliq AI — Ask AI Server Function
 *
 * This is the secure bridge between the browser (React) and Gemini.
 * TanStack Start compiles this into a server-only endpoint that the
 * browser calls via an auto-generated HTTP handler — the Gemini API
 * key never touches the client bundle.
 *
 * Usage (from any React component or route):
 *
 *   import { askAi } from "@/server/functions/askAi"
 *
 *   const result = await askAi({ data: { prompt: "Hello" } })
 *   console.log(result.response)
 */

import { createServerFn } from "@tanstack/react-start";
import { callGemini, type AIResponse } from "../ai";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AskAiInput {
  /** The user's message or instruction. */
  prompt: string;
  /**
   * Optional: the full plain-text content of the active document.
   * Pass this when the request involves the document (e.g. "Summarize this").
   * Kept optional so quick prompts (e.g. "What is quantum computing?") don't
   * need to serialize the entire document unnecessarily.
   */
  documentContext?: string;
  /**
   * Optional: the currently selected text.
   */
  /**
   * Optional: the currently selected text.
   */
  selectedText?: string;
  /**
   * Optional: force mode.
   */
  mode?: "auto" | "text" | "image";
}

export interface AskAiOutput {
  /** The AI-generated response (text or image) */
  response: AIResponse;
}

// ─── Server Function ──────────────────────────────────────────────────────────

/**
 * Primary AI server function for Colliq.
 *
 * Accepts a free-form prompt and optional document context,
 * routes the request through the centralized Gemini service,
 * and returns the generated response.
 *
 * This function runs exclusively on the server — never in the browser.
 */
export const askAi = createServerFn({ method: "POST" })
  .validator((d: AskAiInput) => d)
  .handler(async (ctx): Promise<AskAiOutput> => {
    const input = ctx.data;

    if (!input?.prompt || typeof input.prompt !== "string" || input.prompt.trim() === "") {
      throw new Error("askAi: 'prompt' is required and must be a non-empty string.");
    }

    const response = await callGemini({
      prompt: input.prompt.trim(),
      documentContext: input.documentContext,
      selectedText: input.selectedText,
      mode: input.mode,
    });

    return { response };
  }
);
