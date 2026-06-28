import { Mark, mergeAttributes } from "@tiptap/core";

/**
 * TipTap Comment Mark
 *
 * Tags a text range with a `commentId`. The mark is stored inside the Yjs
 * document so it travels automatically with the text as collaborators edit.
 *
 * A text range can carry multiple comment marks (one per open thread).
 */
export const CommentMark = Mark.create({
  name: "comment",

  // Allow multiple comment marks on the same text (inclusive spans)
  inclusive: false,
  spanning: false,
  excludes: "",

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-comment-id"),
        renderHTML: (attributes) => {
          if (!attributes.commentId) return {};
          return { "data-comment-id": attributes.commentId };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { class: "comment-mark" }),
      0,
    ];
  },
});

/* ──────────────────────────────────────────────────────────────
   HELPERS — apply / remove marks in the editor
────────────────────────────────────────────────────────────── */

/** Apply a comment mark to the current selection */
export function applyCommentMark(editor: any, commentId: string) {
  editor
    .chain()
    .focus()
    .setMark("comment", { commentId })
    .run();
}

/** Remove a comment mark by its commentId from the entire document */
export function removeCommentMark(editor: any, commentId: string) {
  const { state, view } = editor;
  const { doc, tr } = state;

  doc.descendants((node: any, pos: number) => {
    const mark = node.marks?.find(
      (m: any) => m.type.name === "comment" && m.attrs.commentId === commentId
    );
    if (mark) {
      tr.removeMark(pos, pos + node.nodeSize, mark.type);
    }
  });

  if (tr.docChanged) {
    view.dispatch(tr);
  }
}

/** Scroll the editor to the first occurrence of a comment mark */
export function scrollEditorToComment(editor: any, commentId: string): boolean {
  const { state, view } = editor;
  const { doc } = state;
  let targetPos: number | null = null;

  doc.descendants((node: any, pos: number) => {
    if (targetPos !== null) return false; // stop early
    const mark = node.marks?.find(
      (m: any) => m.type.name === "comment" && m.attrs.commentId === commentId
    );
    if (mark) {
      targetPos = pos;
    }
  });

  if (targetPos === null) return false;

  const domNode = view.nodeDOM(targetPos) as HTMLElement | null;
  if (domNode) {
    domNode.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return true;
}
