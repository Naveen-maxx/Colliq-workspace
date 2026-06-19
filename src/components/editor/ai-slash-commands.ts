/**
 * Colliq AI Slash Command Registry
 *
 * Centralized definitions for all AI-powered slash commands.
 * Each command has a behavior type that controls how it is handled:
 *
 *   preview   → Generates content and opens AIPreviewCard for review (summarize, outline)
 *   popover   → Opens a custom input popover first (outline)
 *   replace   → Opens SelectionAIOverlay with existing paragraph (rewrite)
 *   continue  → Inserts continuation at cursor position directly
 */

import { Sparkles } from "lucide-react";
import { type Editor } from "@tiptap/react";
import { toast } from "sonner";
import { askAi } from "@/server/functions/askAi";
import type { AIController } from "@/lib/ai-controller";
import { marked } from "marked";
import type { CommandItem } from "./slash-command";

export type AICommandBehavior = "preview" | "popover" | "replace" | "continue";

export interface AICommandDef {
  id: string;
  title: string;
  description: string;
  icon: typeof Sparkles;
  behavior: AICommandBehavior;
  instruction: string;
}

export const AI_COMMANDS: AICommandDef[] = [
  {
    id: "summarize",
    title: "Summarize",
    description: "Summarize this document.",
    icon: Sparkles,
    behavior: "preview",
    instruction:
      "Write a concise, well-structured summary of this document. Capture the key points clearly.",
  },
  {
    id: "outline",
    title: "Generate Outline",
    description: "Create a structured outline from a topic or this document.",
    icon: Sparkles,
    behavior: "popover",
    instruction: "", // Handled by OutlinePopover
  },
  {
    id: "continue",
    title: "Continue Writing",
    description: "Continue writing from the current paragraph.",
    icon: Sparkles,
    behavior: "continue",
    instruction:
      "Continue writing naturally from exactly where the text ends. Match the author's tone and style. Output only the continuation text — no preamble, no explanation.",
  },
  {
    id: "rewrite",
    title: "Rewrite",
    description: "Rewrite the current paragraph.",
    icon: Sparkles,
    behavior: "replace",
    instruction:
      "Rewrite the selected text to improve readability and flow while preserving the original meaning and tone.",
  },
];

/**
 * Extract the current paragraph context for use in /continue and /rewrite.
 * Returns the text of the paragraph the cursor is inside.
 */
function getCurrentParagraphContext(editor: Editor): {
  text: string;
  from: number;
  to: number;
} {
  const { state } = editor;
  const { $head } = state.selection;
  const node = $head.parent;

  const from = $head.before();
  const to = $head.after();
  const text = node.textContent || "";

  return { text, from, to };
}

/**
 * Get the surrounding context (up to 2 paragraphs above) for /continue.
 */
function getLocalWritingContext(editor: Editor): string {
  const { state } = editor;
  const { $head } = state.selection;
  const cursorPos = $head.pos;

  // Walk back up to 2 blocks above to grab writing context
  let context = "";
  let blocksFound = 0;
  const maxBlocks = 3;

  state.doc.nodesBetween(0, cursorPos, (node, pos) => {
    if (node.isTextblock && node.textContent.trim() && blocksFound < maxBlocks) {
      context += node.textContent + "\n\n";
      blocksFound++;
    }
  });

  return context.trim();
}

/**
 * Build the list of AI CommandItems from the registry.
 * These are merged into the existing slash menu at the top.
 */
export function getAISuggestionItems(
  editor: Editor,
  aiController: AIController,
  query: string
): CommandItem[] {
  return AI_COMMANDS.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase()) ||
    cmd.id.toLowerCase().includes(query.toLowerCase())
  ).map((cmd): CommandItem => ({
    title: cmd.title,
    description: cmd.description,
    icon: Sparkles,
    isAI: true,
    command: async ({ editor: ed, range }) => {
      // Delete the slash trigger first
      ed.chain().focus().deleteRange(range).run();

      if (cmd.behavior === "popover") {
        // /outline — open outline popover
        const insertAt = ed.state.selection.from;
        const documentContext = ed.getText();
        aiController.openOutlinePopover({ insertAt, documentContext });
        return;
      }

      if (cmd.behavior === "replace") {
        // /rewrite — detect current paragraph and open SelectionAIOverlay
        const { text, from, to } = getCurrentParagraphContext(ed);
        if (!text.trim()) {
          toast.error("Place your cursor inside a paragraph to rewrite.");
          return;
        }
        aiController.openSelectionAI({
          from,
          to,
          selectedText: text,
          documentContext: ed.getText(),
        });
        return;
      }

      if (cmd.behavior === "continue") {
        // /continue — use local context only (not full doc)
        const context = getLocalWritingContext(ed);
        const insertAt = ed.state.selection.from;

        if (!context) {
          toast.error("Start writing something first.");
          return;
        }

        const toastId = toast.loading("✨ Continuing writing…");

        try {
          const res = await askAi({
            data: {
              prompt: cmd.instruction,
              selectedText: context,
              mode: "text",
            },
          });
          
          if (res.response.type === "text") {
            const html = marked.parse(res.response.content, { async: false }) as string;
            ed.chain().focus().insertContentAt(insertAt, html).run();
          }
          toast.dismiss(toastId);
        } catch {
          toast.dismiss(toastId);
          toast.error("Failed to continue writing.");
        }
        return;
      }

      if (cmd.behavior === "preview") {
        // /summarize — open preview card with loading state first
        const insertAt = ed.state.selection.from;
        const documentContext = ed.getText();

        if (!documentContext.trim()) {
          toast.error("The document is empty — write something first.");
          return;
        }

        // Open the preview card in loading state
        aiController.openSummaryPreview({
          content: "",
          insertAt,
          isLoading: true,
          title: "Document Summary",
        });

        try {
          const res = await askAi({
            data: {
              prompt: cmd.instruction,
              documentContext,
              mode: "text",
            },
          });
          // Update the preview card with the generated content
          if (res.response.type === "text") {
            aiController.openSummaryPreview({
              content: res.response.content,
              insertAt,
              isLoading: false,
              title: "Document Summary",
            });
          }
        } catch {
          toast.error("Failed to generate summary.");
          aiController.closeSummaryPreview();
        }
        return;
      }
    },
  }));
}
