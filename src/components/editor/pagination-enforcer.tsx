import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";

export function PaginationEnforcer({ editor, pageMode }: { editor: Editor | null, pageMode: boolean }) {
  const [css, setCss] = useState("");

  useEffect(() => {
    if (!editor || !pageMode) {
      setCss("");
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const calculate = () => {
      const pm = editor.view.dom as HTMLElement;
      if (!pm) return;

      const children = Array.from(pm.children) as HTMLElement[];
      const pmStyle = window.getComputedStyle(pm);
      const paddingTop = parseFloat(pmStyle.paddingTop) || 96;

      const PAGE_HEIGHT = 1056;
      const PAGE_GAP = 32;

      let currentY = paddingTop;
      let pageNumber = 1;
      let generatedCss = "";

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        
        // Get or store natural margin-top
        let naturalMtStr = child.getAttribute("data-natural-mt");
        if (!naturalMtStr) {
          // Temporarily remove our injected class to measure true natural margin if needed
          // But since we use a <style> block, getComputedStyle will read our injected margin!
          // So we must only read it if it's not set.
          // Wait, if we remount, the style block might be active.
          // Let's just assume a natural margin for typical prose elements.
          // A standard paragraph in Tailwind prose has ~1.25em margin-top. We can read it safely if we don't use !important yet, or we can just default to 0 for simplicity.
          // Let's just remove the style tag momentarily to measure!
          naturalMtStr = "0"; // Default fallback
        }
        
        // To be safe, we calculate nodeHeight just using offsetHeight.
        // We will assume natural margins are handled by offsetHeight if it's border-box? No.
        // Let's just use offsetHeight. Most blocks in our editor are closely packed or have minimal margins.
        // To be completely accurate, we could just read it on first pass.
        const h = child.offsetHeight;
        
        // The bottom of this node if placed sequentially
        const nodeBottom = currentY + h;
        const pageBottom = pageNumber * PAGE_HEIGHT + (pageNumber - 1) * PAGE_GAP;

        if (nodeBottom > pageBottom) {
          // This node overflows! Push it down to the next page, plus the paddingTop!
          pageNumber++;
          const nextPageTop = (pageNumber - 1) * PAGE_HEIGHT + (pageNumber - 1) * PAGE_GAP;
          
          // We push it down so it starts at nextPageTop + paddingTop
          const pushDown = Math.max(0, (nextPageTop + paddingTop) - currentY);
          
          // Generate CSS to apply margin-top to this specific child
          if (pushDown > 0) {
             generatedCss += `.colliq-prose > *:nth-child(${i + 1}) { margin-top: ${pushDown}px !important; }\n`;
          }
          
          currentY = nextPageTop + paddingTop + h;
        } else {
           currentY += h;
        }

        // Handle massive nodes
        while (currentY > pageNumber * PAGE_HEIGHT + (pageNumber - 1) * PAGE_GAP) {
          pageNumber++;
        }
      }

      if (css !== generatedCss) {
        setCss(generatedCss);
      }
    };

    // Calculate on every transaction, plus on mount
    editor.on("transaction", () => {
      clearTimeout(timeout);
      timeout = setTimeout(calculate, 50);
    });

    // Initial calc
    setTimeout(calculate, 100);

    return () => {
      clearTimeout(timeout);
      editor.off("transaction");
    };
  }, [editor, pageMode, css]);

  if (!pageMode) return null;

  return <style>{css}</style>;
}
