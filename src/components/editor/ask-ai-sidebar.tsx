import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Copy, ArrowDownToLine, RefreshCw, Send, Square, Check } from "lucide-react";
import { type Editor } from "@tiptap/react";
import ReactMarkdown from "react-markdown";
import { askAi } from "@/server/functions/askAi";
import { insertAiContent } from "@/lib/ai-insert";
import { handleImageUpload } from "@/components/editor/extensions/image-upload";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AskAISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
}

type Message =
  | {
      id: string;
      role: "user";
      type: "text";
      content: string;
    }
  | {
      id: string;
      role: "ai";
      type: "text";
      content: string;
    }
  | {
      id: string;
      role: "ai";
      type: "image";
      prompt: string;
      imageData: string;
    };

const IMAGE_INTENT_REGEX = /\b(generate an image|create an image|create a picture|generate a picture|draw|illustration of|poster for|logo for|banner for|infographic of)\b/i;

const STARTER_PROMPTS = [
  "Summarize this document",
  "Improve the writing",
  "Generate a conclusion",
  "Create an outline",
  "Find weak sections",
  "Generate an image",
];

export function AskAISidebar({ isOpen, onClose, editor }: AskAISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"text" | "image">("text");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !editor) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", type: "text", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    
    const isImage = IMAGE_INTENT_REGEX.test(text);
    setLoadingType(isImage ? "image" : "text");
    setIsLoading(true);

    const controller = new AbortController();
    setAbortController(controller);

    try {
      const documentContext = editor.getText();
      const result = await askAi({ data: { prompt: text, documentContext, mode: "auto" } });

      if (!controller.signal.aborted) {
        if (result.response.type === "image") {
          const aiMsg: Message = { id: crypto.randomUUID(), role: "ai", type: "image", prompt: result.response.prompt, imageData: result.response.imageData };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          const aiMsg: Message = { id: crypto.randomUUID(), role: "ai", type: "text", content: result.response.content };
          setMessages((prev) => [...prev, aiMsg]);
        }
      }
    } catch (e: any) {
      if (!controller.signal.aborted) {
        toast.error("Failed to get response from Colliq AI");
        console.error(e);
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setAbortController(null);
      }
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
  };

  const handleRegenerate = (promptOverride?: string) => {
    if (promptOverride) {
      handleSend(promptOverride);
      return;
    }
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg && lastUserMsg.type === "text") {
      handleSend(lastUserMsg.content);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Auto-resize textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "44px"; // reset
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 150) + "px";
    }
  }, [input]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "100%", opacity: 0.5 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 right-0 top-0 z-50 flex w-[400px] flex-col border-l border-border/50 bg-[#FAFAFA] shadow-[0_0_40px_rgba(0,0,0,0.05)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4 bg-white/50 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white shadow-[0_2px_8px_-2px_rgba(80,60,200,0.4)]">
                <Sparkles size={14} strokeWidth={2.5} />
              </div>
              <h2 className="font-display text-[15px] font-semibold text-foreground">Colliq AI</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col justify-center pb-12">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary/10 to-[var(--accent-violet)]/10 text-primary">
                    <Sparkles size={24} strokeWidth={2} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-foreground">Colliq AI</h3>
                  <p className="mt-1.5 text-[14px] text-muted-foreground">
                    Your writing assistant inside every document.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => handleSend(prompt)}
                      className="rounded-lg border border-border/50 bg-white px-4 py-3.5 text-left text-[14px] font-medium text-foreground/80 shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-[0.98]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {messages.map((msg, i) => (
                  <MessageBubble key={msg.id} message={msg} editor={editor} isLast={i === messages.length - 1} onRegenerate={handleRegenerate} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <div className="grid h-6 w-6 shrink-0 place-items-center rounded bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white shadow-sm">
                      <Sparkles size={12} strokeWidth={2.5} className="animate-pulse" />
                    </div>
                    {loadingType === "image" ? (
                      <span className="text-[13px] font-medium text-primary animate-pulse">🎨 Generating image — this may take a few seconds...</span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/40" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/60" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/80" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Footer Input */}
          <div className="border-t border-border/50 bg-white p-4">
            <div className="relative rounded-xl border border-border/60 bg-[#FAFAFA] shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask AI anything..."
                className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-[14.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                rows={1}
              />
              <div className="absolute bottom-2 right-2">
                {isLoading ? (
                  <button
                    onClick={handleStop}
                    title="Stop Generating"
                    className="grid h-8 w-8 place-items-center rounded-lg bg-black/5 text-foreground/70 transition-colors hover:bg-black/10 hover:text-foreground"
                  >
                    <Square size={13} className="fill-current" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleSend(input)}
                    disabled={!input.trim()}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white shadow-sm transition-all hover:bg-[color-mix(in_oklab,var(--primary)_90%,black)] disabled:opacity-50"
                  >
                    <Send size={14} className="ml-0.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-2.5 text-center text-[11.5px] text-muted-foreground/70">
              AI can make mistakes. Verify important information.
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MessageBubble({ message, editor, isLast, onRegenerate }: { message: Message; editor: Editor | null; isLast: boolean; onRegenerate: (prompt?: string) => void }) {
  const [copied, setCopied] = useState(false);
  const [inserted, setInserted] = useState(false);

  const handleCopy = () => {
    if (message.type !== "text") return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = () => {
    if (editor && message.type === "text") {
      insertAiContent(editor, message.content);
      setInserted(true);
      setTimeout(() => setInserted(false), 2000);
    }
  };

  if (message.role === "user" && message.type === "text") {
    return (
      <div className="flex flex-col items-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-black/5 px-4 py-2.5 text-[14px] text-foreground/90">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === "ai" && message.type === "image") {
    const handleInsertImage = () => {
      if (!editor) return;
      // Derive the real mime type from the data URI (may be image/png or image/jpeg)
      const mimeMatch = message.imageData.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch?.[1] ?? "image/png";
      const ext = mimeType.split("/")[1] ?? "png";
      const byteString = atob(message.imageData.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const file = new File([ab], `ai-generated-image.${ext}`, { type: mimeType });
      handleImageUpload(file, editor.view, editor.state.selection.from);
      setInserted(true);
      setTimeout(() => setInserted(false), 2000);
    };

    const handleDownload = () => {
      const mimeMatch = message.imageData.match(/^data:([^;]+);base64,/);
      const ext = mimeMatch?.[1]?.split("/")[1] ?? "png";
      const a = document.createElement("a");
      a.href = message.imageData;
      a.download = `colliq-ai-image.${ext}`;
      a.click();
    };

    const handleCopyPrompt = () => {
      navigator.clipboard.writeText(message.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex gap-3">
          <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white shadow-sm">
            <Sparkles size={12} strokeWidth={2.5} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-white shadow-sm">
            <img src={message.imageData} alt={message.prompt} className="w-full h-auto object-contain" />
          </div>
        </div>

        <div className="ml-9 flex flex-wrap items-center gap-1.5">
          <ActionButton icon={inserted ? Check : ArrowDownToLine} label={inserted ? "Inserted" : "Insert"} onClick={handleInsertImage} active={inserted} />
          <ActionButton icon={ArrowDownToLine} label="Download" onClick={handleDownload} />
          <ActionButton icon={copied ? Check : Copy} label={copied ? "Prompt Copied" : "Copy Prompt"} onClick={handleCopyPrompt} active={copied} />
          {isLast && (
            <ActionButton icon={RefreshCw} label="Regenerate" onClick={() => onRegenerate(message.prompt)} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex gap-3">
        <div className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded bg-gradient-to-br from-primary to-[var(--accent-violet)] text-white shadow-sm">
          <Sparkles size={12} strokeWidth={2.5} />
        </div>
        <div className="prose prose-sm colliq-prose min-w-0 flex-1 leading-[1.65] text-foreground/90 prose-p:leading-[1.65] prose-pre:bg-surface-muted prose-pre:text-[13px] prose-p:my-2 prose-headings:my-3">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.type === "text" ? message.content : ""}</ReactMarkdown>
        </div>
      </div>

      <div className="ml-9 flex items-center gap-1.5">
        <ActionButton icon={copied ? Check : Copy} label={copied ? "Copied" : "Copy"} onClick={handleCopy} active={copied} />
        <ActionButton icon={inserted ? Check : ArrowDownToLine} label={inserted ? "Inserted" : "Insert"} onClick={handleInsert} active={inserted} />
        {isLast && (
          <ActionButton icon={RefreshCw} label="Regenerate" onClick={() => onRegenerate()} />
        )}
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick, active }: { icon: any; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors",
        active 
          ? "bg-emerald-50 text-emerald-600" 
          : "text-muted-foreground hover:bg-black/5 hover:text-foreground"
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
