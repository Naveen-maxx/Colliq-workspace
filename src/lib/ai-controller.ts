/**
 * Colliq AI Controller
 *
 * A centralized, imperative controller that any part of the editor can call
 * to trigger AI workflows. This avoids event-spaghetti and keeps all AI
 * entry points consistent.
 *
 * Usage:
 *   const controller = useAIController();
 *   controller.openSelectionAI({ text, from, to });
 *   controller.openSummaryPreview({ content, insertAt });
 *   controller.openOutlinePopover({ insertAt, documentContext });
 */

import type { AIStateSnapshot } from "@/components/editor/selection-ai-overlay";

export interface SummaryPreviewState {
  isOpen: boolean;
  title: string;
  content: string;
  insertAt: number;
  isLoading: boolean;
}

export interface OutlinePopoverState {
  isOpen: boolean;
  insertAt: number;
  documentContext: string;
}

export interface AIController {
  /** Open the Selection AI Overlay (Phase 2B) with a pre-captured snapshot */
  openSelectionAI: (snapshot: AIStateSnapshot) => void;
  /** Open the Summary preview card */
  openSummaryPreview: (state: Omit<SummaryPreviewState, "isOpen">) => void;
  /** Close the summary preview card */
  closeSummaryPreview: () => void;
  /** Open the Outline topic popover */
  openOutlinePopover: (opts: { insertAt: number; documentContext: string }) => void;
}
