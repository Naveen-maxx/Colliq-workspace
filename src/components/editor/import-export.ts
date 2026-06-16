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

// Inlined prose styles for the PDF print window (CSS variables replaced with resolved values)
const PDF_PRINT_STYLES = `
  @page { margin: 0.75in; size: letter portrait; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page-break { page-break-after: always; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 15.5px;
    line-height: 1.75;
    color: #0d0d0d;
    background: white;
  }
  h1 { font-size: 30px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; margin: 0.6em 0 0.3em; }
  h2 { font-size: 22px; font-weight: 600; letter-spacing: -0.015em; line-height: 1.3; margin: 0.6em 0 0.25em; }
  h3 { font-size: 17px; font-weight: 600; line-height: 1.35; margin: 0.5em 0 0.2em; }
  p  { margin: 0.45em 0; }
  ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
  ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
  ul[data-type="taskList"] { list-style: none; padding-left: 0.2em; }
  ul[data-type="taskList"] li { display: flex; gap: 0.55em; align-items: flex-start; margin: 0.2em 0; }
  ul[data-type="taskList"] li > label { margin-top: 0.35em; }
  ul[data-type="taskList"] input[type="checkbox"] { width: 14px; height: 14px; cursor: default; }
  blockquote { border-left: 3px solid #cbd5e1; padding-left: 0.9em; color: #64748b; margin: 0.6em 0; }
  code { background: #f1f5f9; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  pre  { background: #f1f5f9; padding: 0.9em 1.1em; border-radius: 8px; overflow-x: auto; margin: 0.6em 0; }
  pre code { background: transparent; padding: 0; }
  hr   { border: none; border-top: 1px solid #e2e8f0; margin: 1.2em 0; }
  a    { color: #5b5bd6; text-decoration: underline; }
  table { border-collapse: collapse; margin: 1.5em 0; width: 100%; }
  table td, table th { border: 1px solid #e2e8f0; padding: 0.6em 0.8em; vertical-align: top; }
  table th { background-color: #f8fafc; font-weight: 600; text-align: left; }
  img  { max-width: 100%; height: auto; }
  strong { font-weight: 700; }
  em { font-style: italic; }
  u  { text-decoration: underline; }
  s  { text-decoration: line-through; }
  mark { background-color: #fef9c3; }
  sup  { vertical-align: super; font-size: 0.75em; }
  sub  { vertical-align: sub; font-size: 0.75em; }
`;

export function exportToPdf(editor: Editor, title: string) {
  const bodyHtml = editor.getHTML();

  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    toast.error("Popup blocked — please allow popups for this site to export PDF.");
    return;
  }

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title || "document"}</title>
  <style>${PDF_PRINT_STYLES}</style>
</head>
<body>${bodyHtml}</body>
</html>`);

  printWindow.document.close();

  // Wait for images to fully load before printing
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close the print window after the user dismisses the dialog
    printWindow.onafterprint = () => printWindow.close();
  };
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
