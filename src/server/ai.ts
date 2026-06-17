/**
 * Colliq AI — Centralized Gemini Service
 *
 * This file is the single point of contact with the Gemini API.
 * ALL AI features (Ask AI, rewrite, summarize, outline, grammar fix)
 * must route through this service — never call Gemini directly elsewhere.
 *
 * Security: This module runs server-side only (inside TanStack server functions).
 * The GEMINI_API_KEY environment variable has no VITE_ prefix and is therefore
 * never included in the browser bundle by Vite.
 */

import { GoogleGenAI } from "@google/genai";

// ─── Guard ────────────────────────────────────────────────────────────────────

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "[Colliq AI] GEMINI_API_KEY is not set.\n" +
      "Add it to your .env file WITHOUT a VITE_ prefix:\n" +
      "  GEMINI_API_KEY=your_key_here\n" +
      "Never expose this key to the browser.",
  );
}

// ─── Client ───────────────────────────────────────────────────────────────────

const ai = new GoogleGenAI({ apiKey: API_KEY });

/** The Gemini model used for all Colliq AI requests. */
const MODEL = "gemini-2.5-flash";

/** Default system persona for Colliq AI. */
const DEFAULT_SYSTEM_PROMPT =
  "You are Colliq AI, a professional writing assistant built into the Colliq document editor. " +
  "Help users write, improve, and organize their documents. " +
  "Be clear, concise, and focused. Avoid unnecessary filler text.";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CallGeminiOptions {
  /** The user's request or instruction. */
  prompt: string;
  /**
   * Optional full document content for context.
   * Provide this when the AI needs to analyze or act on the whole document
   * (e.g. Summarize this document, Improve this document).
   */
  documentContext?: string;
  /**
   * Optional system prompt override.
   * Defaults to the Colliq AI persona above.
   */
  systemPrompt?: string;
}

// ─── Core Service ─────────────────────────────────────────────────────────────

/**
 * Send a prompt to Gemini 2.5 Flash and return the text response.
 *
 * @example
 * const text = await callGemini({ prompt: "Write a short introduction about AI" });
 *
 * @example — with document context
 * const text = await callGemini({
 *   prompt: "Summarize this document",
 *   documentContext: editor.getText(),
 * });
 */
export async function callGemini({
  prompt,
  documentContext,
  systemPrompt,
}: CallGeminiOptions): Promise<string> {
  const system = systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  // If document context is supplied, prepend it so Gemini can reason over the document.
  const userContent = documentContext
    ? `[Document Content]\n${documentContext}\n\n[User Request]\n${prompt}`
    : prompt;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userContent,
    config: {
      systemInstruction: system,
    },
  });

  return response.text ?? "";
}
