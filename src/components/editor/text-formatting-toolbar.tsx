import { BubbleMenu } from "@tiptap/react/menus";
import { type Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  MessageSquarePlus,
  Link2,
  ChevronDown,
  Palette,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useEditorTypography, UnifiedFontFamilyDropdown, UnifiedFontSizeDropdown } from "@/components/editor/typography-controls";

export function TextFormattingToolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return null;

  // Render logic: Only show if text is selected, and it's not empty, and not an image/node selection
  const shouldShow = ({ editor, view, state, from, to }: any) => {
    const { doc, selection } = state;
    const { empty } = selection;

    if (empty) return false;
    
    // Check if the selection contains only images or node selections
    const isNodeSelection = selection.node && selection.node.isLeaf;
    if (isNodeSelection) return false;
    
    // Check if we are inside a code block (don't show toolbar for code blocks usually)
    if (editor.isActive("codeBlock")) return false;

    return true;
  };

  const colors = ["#000000", "#4B5563", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"];
  const highlights = ["transparent", "#FEF08A", "#BBF7D0", "#BFDBFE", "#FBCFE8"];

  const { activeFont, activeSize } = useEditorTypography(editor);

  const [showColors, setShowColors] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [showAlignments, setShowAlignments] = useState(false);
  const [showLists, setShowLists] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  return (
    // @ts-ignore
    <BubbleMenu
      editor={editor}
      shouldShow={shouldShow}
      // @ts-ignore
      tippyOptions={{ duration: 150, animation: "shift-away", placement: "top", interactive: true }}
      className="flex items-center gap-1 rounded-xl border border-border-soft bg-white p-1 shadow-[0_12px_36px_-12px_rgba(40,40,90,0.25)]"
    >
      <UnifiedFontFamilyDropdown editor={editor} activeFont={activeFont} />
      <div className="h-4 w-px bg-border-soft" />
      <UnifiedFontSizeDropdown editor={editor} activeSize={activeSize} />
      <div className="h-4 w-px bg-border-soft" />

      {/* Formatting Toggles */}
      <div className="flex items-center">
        <FormatButton
          icon={Bold}
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <FormatButton
          icon={Italic}
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <FormatButton
          icon={Underline}
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <FormatButton
          icon={Strikethrough}
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
      </div>

      <div className="h-4 w-px bg-border-soft" />

      {/* Text Color */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowColors(!showColors);
            setShowHighlights(false);
            setShowAlignments(false);
            setShowLists(false);
            setShowLinkInput(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-surface-muted"
        >
          <Palette size={15} strokeWidth={2} />
        </button>
        {showColors && (
          <div className="absolute left-1/2 top-full mt-1 flex -translate-x-1/2 gap-1 rounded-xl border border-border-soft bg-white p-1 shadow-lg">
            {colors.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  editor.chain().focus().setColor(c).run();
                  setShowColors(false);
                }}
                className="h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Highlight Color */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowHighlights(!showHighlights);
            setShowColors(false);
            setShowAlignments(false);
            setShowLists(false);
            setShowLinkInput(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-surface-muted"
        >
          <Highlighter size={15} strokeWidth={2} />
        </button>
        {showHighlights && (
          <div className="absolute left-1/2 top-full mt-1 flex -translate-x-1/2 gap-1 rounded-xl border border-border-soft bg-white p-1 shadow-lg">
            {highlights.map((c) => (
              <button
                key={c}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (c === "transparent") editor.chain().focus().unsetHighlight().run();
                  else editor.chain().focus().setHighlight({ color: c }).run();
                  setShowHighlights(false);
                }}
                className="relative h-6 w-6 rounded-full border border-black/10"
                style={{ backgroundColor: c === "transparent" ? "#fff" : c }}
              >
                {c === "transparent" && (
                  <div className="absolute inset-0 m-auto h-[2px] w-[20px] -rotate-45 bg-red-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-border-soft" />

      {/* Alignments */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowAlignments(!showAlignments);
            setShowColors(false);
            setShowHighlights(false);
            setShowLists(false);
            setShowLinkInput(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-surface-muted"
        >
          {editor.isActive({ textAlign: "center" }) ? (
            <AlignCenter size={15} strokeWidth={2} />
          ) : editor.isActive({ textAlign: "right" }) ? (
            <AlignRight size={15} strokeWidth={2} />
          ) : (
            <AlignLeft size={15} strokeWidth={2} />
          )}
        </button>
        {showAlignments && (
          <div className="absolute left-1/2 top-full mt-1 flex -translate-x-1/2 flex-col gap-1 rounded-xl border border-border-soft bg-white p-1 shadow-lg">
            <FormatButton
              icon={AlignLeft}
              isActive={editor.isActive({ textAlign: "left" })}
              onClick={() => {
                editor.chain().focus().setTextAlign("left").run();
                setShowAlignments(false);
              }}
            />
            <FormatButton
              icon={AlignCenter}
              isActive={editor.isActive({ textAlign: "center" })}
              onClick={() => {
                editor.chain().focus().setTextAlign("center").run();
                setShowAlignments(false);
              }}
            />
            <FormatButton
              icon={AlignRight}
              isActive={editor.isActive({ textAlign: "right" })}
              onClick={() => {
                editor.chain().focus().setTextAlign("right").run();
                setShowAlignments(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Lists */}
      <div className="relative">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setShowLists(!showLists);
            setShowColors(false);
            setShowHighlights(false);
            setShowAlignments(false);
            setShowLinkInput(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-surface-muted"
        >
          <List size={15} strokeWidth={2} />
        </button>
        {showLists && (
          <div className="absolute left-1/2 top-full mt-1 flex -translate-x-1/2 flex-col gap-1 rounded-xl border border-border-soft bg-white p-1 shadow-lg">
            <FormatButton
              icon={List}
              isActive={editor.isActive("bulletList")}
              onClick={() => {
                editor.chain().focus().toggleBulletList().run();
                setShowLists(false);
              }}
            />
            <FormatButton
              icon={ListOrdered}
              isActive={editor.isActive("orderedList")}
              onClick={() => {
                editor.chain().focus().toggleOrderedList().run();
                setShowLists(false);
              }}
            />
            <FormatButton
              icon={CheckSquare}
              isActive={editor.isActive("taskList")}
              onClick={() => {
                editor.chain().focus().toggleTaskList().run();
                setShowLists(false);
              }}
            />
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-border-soft" />

      {/* Link */}
      <div className="relative">
        <FormatButton
          icon={Link2}
          isActive={editor.isActive("link") || showLinkInput}
          onClick={() => {
            if (showLinkInput) {
              setShowLinkInput(false);
              return;
            }
            const previousUrl = editor.getAttributes("link").href;
            setLinkUrl(previousUrl || "");
            setShowLinkInput(true);
            
            // Close others
            setShowColors(false);
            setShowHighlights(false);
            setShowAlignments(false);
            setShowLists(false);
          }}
        />
        {showLinkInput && (
          <div className="absolute left-1/2 top-full mt-1 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border-soft bg-white p-1.5 shadow-lg">
            <input
              autoFocus
              type="url"
              placeholder="Paste or type link..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (linkUrl === "") {
                    editor.chain().focus().extendMarkRange("link").unsetLink().run();
                  } else {
                    editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
                  }
                  setShowLinkInput(false);
                }
                if (e.key === "Escape") {
                  setShowLinkInput(false);
                }
              }}
              className="w-48 rounded-md bg-surface-muted px-2.5 py-1.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (linkUrl === "") {
                  editor.chain().focus().extendMarkRange("link").unsetLink().run();
                } else {
                  editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
                }
                setShowLinkInput(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white hover:bg-primary/90"
            >
              <Check size={14} />
            </button>
          </div>
        )}
      </div>
      
      {/* Comment */}
      <FormatButton
        icon={MessageSquarePlus}
        isActive={false}
        onClick={() => {
          toast.info("Comments will be available in the collaboration phase.");
        }}
      />
    </BubbleMenu>
  );
}

function FormatButton({
  icon: Icon,
  isActive,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 w-8 place-items-center rounded-md transition-colors ${
        isActive ? "bg-primary-soft text-primary" : "text-foreground hover:bg-surface-muted"
      }`}
    >
      <Icon size={15} strokeWidth={2} />
    </button>
  );
}
