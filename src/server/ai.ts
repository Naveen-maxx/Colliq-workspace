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
   * Optional currently selected text.
   * Provide this when the AI needs to act on a specific portion of the document.
   */
  selectedText?: string;
  /**
   * Optional system prompt override.
   * Defaults to the Colliq AI persona above.
   */
  systemPrompt?: string;
  /**
   * Optional forced mode. If not provided, defaults to "auto".
   */
  mode?: "auto" | "text" | "image";
}

export type AIResponse =
  | { type: "text"; content: string }
  | { type: "image"; prompt: string; imageData: string };

const IMAGE_INTENT_REGEX = /\b(generate an image|create an image|create a picture|generate a picture|draw|illustration of|poster for|logo for|banner for|infographic of)\b/i;

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
  selectedText,
  systemPrompt,
  mode = "auto",
}: CallGeminiOptions): Promise<AIResponse> {
  const isImageIntent = mode === "image" || (mode === "auto" && IMAGE_INTENT_REGEX.test(prompt));

  if (isImageIntent) {
    // Gemini image generation (Imagen 3, gemini-*-flash-image) requires a paid plan —
    // the free tier quota is 0 for all image generation models.
    // Instead we use Pollinations.AI: a completely free, no-auth AI image generation API
    // that accepts a text prompt and returns a real JPEG image.
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true&model=flux`;

    const imageResponse = await fetch(imageUrl, {
      signal: AbortSignal.timeout(60_000), // 60s timeout for generation
    });

    if (!imageResponse.ok) {
      throw new Error(
        `[Colliq AI] Image generation service returned ${imageResponse.status}: ${imageResponse.statusText}`,
      );
    }

    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") ?? "image/jpeg";

    return {
      type: "image",
      prompt,
      imageData: `data:${mimeType};base64,${base64}`,
    };
  }

  // Text Flow
  const system = systemPrompt ?? DEFAULT_SYSTEM_PROMPT;

  // Build the user content context
  let userContent = "";

  if (documentContext) {
    userContent += `[Document Content]\n${documentContext}\n\n`;
  }

  if (selectedText) {
    userContent += `[Selected Text to Modify]\n${selectedText}\n\n`;
  }

  userContent += `[Instruction]\n${prompt}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: userContent,
    config: {
      systemInstruction: system,
    },
  });

  return { type: "text", content: response.text ?? "" };
}
