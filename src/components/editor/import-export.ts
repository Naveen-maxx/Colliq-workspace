import type { Editor } from "@tiptap/react";
import mammoth from "mammoth";
import pkg from "file-saver";
const { saveAs } = pkg;
import { asBlob } from "html-docx-js-typescript";
import { toast } from "sonner";

export async function exportToDocx(editor: Editor, title: string) {
  try {
    const html = `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>${title}</title></head>
        <body>${editor.getHTML()}</body>
      </html>
    `;
    const blob = await asBlob(html);
    saveAs(blob as Blob, `${title || "document"}.docx`);
  } catch (err) {
    console.error("DOCX Export failed:", err);
    toast.error("Failed to export DOCX.");
  }
}

export function exportToHtml(editor: Editor, title: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><title>${title}</title></head>
      <body>${editor.getHTML()}</body>
    </html>
  `;
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  saveAs(blob, `${title || "document"}.html`);
}

export function exportToTxt(editor: Editor, title: string) {
  const text = editor.getText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `${title || "document"}.txt`);
}

export function exportToPdf() {
  window.print();
}

export async function importDocx(file: File, editor: Editor) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    editor.commands.setContent(result.value);
  } catch (err) {
    console.error("DOCX Import failed:", err);
    toast.error("Failed to import DOCX.");
  }
}

export async function importTxt(file: File, editor: Editor) {
  try {
    const text = await file.text();
    // Wrap text in paragraphs for TipTap
    const html = text.split("\n").map(line => `<p>${line}</p>`).join("");
    editor.commands.setContent(html);
  } catch (err) {
    console.error("TXT Import failed:", err);
    toast.error("Failed to import TXT.");
  }
}
