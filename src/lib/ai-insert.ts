import { type Editor } from "@tiptap/react";

/**
 * Smart insertion logic for AI generated content into the TipTap editor.
 * 
 * Rules:
 * 1. If text is selected: Replace selected text.
 * 2. If a cursor exists (editor is focused): Insert at cursor.
 * 3. If no active selection/cursor exists: Insert at the end of the document.
 */
export function insertAiContent(editor: Editor, content: string) {
  const { state, isFocused } = editor;
  const { selection } = state;

  // We consider a selection "valid" if the editor is focused, OR if there's an actual range selected.
  // TipTap preserves selection even when blurred, so we check if it's an active cursor by focus,
  // or a real selection block by checking if it's not empty.
  const hasSelectionBlock = !selection.empty;
  
  if (isFocused || hasSelectionBlock) {
    // TipTap's insertContent automatically replaces the selection if there is one,
    // or inserts at the current cursor position if it's just a blinking cursor.
    editor.chain().focus().insertContent(content).run();
  } else {
    // If the user clicked away completely and has no active selection block,
    // we drop the content at the very end of the document.
    const endPosition = state.doc.content.size;
    editor.chain().focus().insertContentAt(endPosition, "\n\n" + content).run();
  }
}
