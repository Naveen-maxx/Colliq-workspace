import React from "react";

export function DocumentPreview({ content }: { content: any }) {
  if (!content || !content.content || !Array.isArray(content.content)) {
    return (
      <div className="flex h-full w-full flex-col p-[6cqi] gap-[3cqi] bg-white">
        <div className="h-[4cqi] w-3/4 rounded-full bg-gray-200" />
        <div className="h-[2cqi] w-full rounded-full bg-gray-100" />
        <div className="h-[2cqi] w-5/6 rounded-full bg-gray-100" />
        <div className="h-[2cqi] w-4/6 rounded-full bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white @container">
      <div
        className="flex w-full flex-col"
        style={{
          padding: "8cqi",
          gap: "2.5cqi",
        }}
      >
        {content.content.map((node: any, i: number) => (
          <PreviewNode key={i} node={node} />
        ))}
      </div>
    </div>
  );
}

function PreviewNode({ node }: { node: any }) {
  if (!node) return null;

  switch (node.type) {
    case "heading": {
      const level = node.attrs?.level || 1;
      const align = node.attrs?.textAlign || "left";
      
      let fontSize = "4cqi"; // h1
      let fontWeight = 700;
      let marginTop = "2.5cqi";
      let color = "#4285F4"; // Google Docs blue for H1
      
      if (level === 2) { fontSize = "3cqi"; fontWeight = 600; marginTop = "2cqi"; color = "#EA4335"; } // Red for H2
      else if (level >= 3) { fontSize = "2.5cqi"; fontWeight = 600; marginTop = "1.5cqi"; color = "#34A853"; } // Green for H3
      
      return (
        <div
          style={{
            fontSize,
            fontWeight,
            marginTop,
            textAlign: align as any,
            color,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            opacity: 0.8,
          }}
          className="truncate"
        >
          {renderText(node)}
        </div>
      );
    }
      
    case "paragraph": {
      const align = node.attrs?.textAlign || "left";
      // Render text if available, otherwise a placeholder line block if empty (for spacing)
      const hasText = node.content && node.content.length > 0;
      
      if (!hasText) {
        return <div style={{ height: "1.5cqi" }} />; // Empty paragraph spacer
      }
      
      return (
        <div
          style={{
            fontSize: "1.4cqi",
            color: "#9ca3af",
            lineHeight: 1.6,
            textAlign: align as any,
            fontWeight: 500,
          }}
          className="line-clamp-4" // Prevent huge paragraphs from taking all space
        >
          {renderText(node)}
        </div>
      );
    }
      
    case "bulletList":
    case "orderedList": {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8cqi", paddingLeft: "3cqi" }}>
          {node.content?.map((item: any, i: number) => {
            const isOrdered = node.type === "orderedList";
            return (
              <div key={i} style={{ display: "flex", gap: "1cqi", fontSize: "1.4cqi", color: "#9ca3af", lineHeight: 1.6, fontWeight: 500 }}>
                <span style={{ flexShrink: 0, fontWeight: 600, color: "#6b7280" }}>
                  {isOrdered ? `${i + 1}.` : "•"}
                </span>
                <div className="line-clamp-2">{renderText(item)}</div>
              </div>
            );
          })}
        </div>
      );
    }
      
    case "taskList": {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1cqi", paddingLeft: "1cqi" }}>
          {node.content?.map((item: any, i: number) => {
            const checked = item.attrs?.checked;
            return (
              <div key={i} style={{ display: "flex", gap: "1.5cqi", fontSize: "2.3cqi", color: "#333", lineHeight: 1.5, alignItems: "center" }}>
                <div 
                  style={{ 
                    width: "2.5cqi", 
                    height: "2.5cqi", 
                    borderRadius: "0.4cqi", 
                    border: `0.2cqi solid ${checked ? '#1a73e8' : '#9aa0a6'}`,
                    backgroundColor: checked ? '#1a73e8' : 'transparent',
                    flexShrink: 0
                  }} 
                />
                <div className="line-clamp-1">{renderText(item)}</div>
              </div>
            );
          })}
        </div>
      );
    }
      
    case "horizontalRule":
      return <div style={{ height: "0.2cqi", backgroundColor: "#d1d5db", margin: "2cqi 0" }} />;
      
    case "image":
      return (
        <div style={{ width: "100%", height: "15cqi", backgroundColor: "#f1f3f4", borderRadius: "0.5cqi", display: "flex", alignItems: "center", justifyContent: "center", border: "0.15cqi solid #e8eaed" }}>
          <svg style={{ width: "4cqi", height: "4cqi", color: "#bdc1c6" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      );
      
    case "table":
      return (
        <div style={{ display: "flex", flexDirection: "column", border: "0.15cqi solid #e5e7eb", overflow: "hidden" }}>
          {node.content?.slice(0, 3)?.map((row: any, rIndex: number) => (
            <div key={rIndex} style={{ display: "flex", borderBottom: rIndex < 2 ? "0.15cqi solid #e5e7eb" : "none", backgroundColor: rIndex === 0 ? "#f9fafb" : "white" }}>
              {row.content?.slice(0, 3)?.map((cell: any, cIndex: number) => (
                <div key={cIndex} style={{ flex: 1, padding: "1cqi", borderRight: cIndex < 2 ? "0.15cqi solid #e5e7eb" : "none", fontSize: "1.2cqi", color: rIndex === 0 ? "#6b7280" : "#9ca3af", fontWeight: rIndex === 0 ? 600 : 500 }}>
                  <div className="line-clamp-1">{renderText(cell)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      );
      
    case "blockquote":
      return (
        <div style={{ borderLeft: "0.4cqi solid #e8eaed", paddingLeft: "2cqi", color: "#5f6368", fontStyle: "italic", fontSize: "1.25cqi" }}>
          {renderText(node)}
        </div>
      );
      
    case "codeBlock":
      return (
        <div style={{ backgroundColor: "#f8f9fa", padding: "1.5cqi", borderRadius: "0.4cqi", fontFamily: "monospace", fontSize: "1.1cqi", color: "#202124" }}>
          <div className="line-clamp-3">{renderText(node)}</div>
        </div>
      );

    default:
      // Fallback for unknown nodes
      return <div className="line-clamp-1" style={{ fontSize: "1.2cqi", color: "#bdc1c6" }}>{renderText(node)}</div>;
  }
}

// Recursively extract text from any node
function renderText(node: any): React.ReactNode {
  if (!node) return null;
  
  if (node.type === "text") {
    let text: React.ReactNode = node.text;
    if (Array.isArray(node.marks)) {
      node.marks.forEach((mark: any) => {
        if (mark.type === "bold") text = <strong style={{ fontWeight: 600 }}>{text}</strong>;
        if (mark.type === "italic") text = <em style={{ fontStyle: "italic" }}>{text}</em>;
        if (mark.type === "underline") text = <u style={{ textDecoration: "underline" }}>{text}</u>;
        if (mark.type === "link") text = <span style={{ color: "#1a73e8", textDecoration: "underline" }}>{text}</span>;
      });
    }
    return text;
  }
  
  if (node.content && Array.isArray(node.content)) {
    return (
      <>
        {node.content.map((child: any, i: number) => (
          <React.Fragment key={i}>{renderText(child)}</React.Fragment>
        ))}
      </>
    );
  }
  
  return null;
}
