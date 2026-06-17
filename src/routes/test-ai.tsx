import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { askAi } from "@/server/functions/askAi";

export const Route = createFileRoute("/test-ai")({
  component: TestAiPage,
});

function TestAiPage() {
  const [prompt, setPrompt] = useState("Hello! Introduce yourself in one sentence.");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTest() {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const result = await askAi({ data: { prompt } });
      setResponse(result.response);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 700, margin: "60px auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        🧪 Colliq AI — Infrastructure Test
      </h1>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 14 }}>
        Verifies: browser → TanStack server function → Gemini 2.5 Flash → browser
      </p>

      <label style={{ display: "block", fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
        Prompt
      </label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "1px solid #ddd",
          borderRadius: 8,
          fontSize: 14,
          boxSizing: "border-box",
          resize: "vertical",
        }}
      />

      <button
        onClick={handleTest}
        disabled={loading || !prompt.trim()}
        style={{
          marginTop: 12,
          padding: "10px 24px",
          background: loading ? "#999" : "#5b5bd6",
          color: "white",
          border: "none",
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Calling Gemini…" : "Send to Gemini"}
      </button>

      {error && (
        <div style={{ marginTop: 20, padding: 16, background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, color: "#b91c1c", fontSize: 14 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
            ✅ Gemini Response
          </div>
          <div style={{ padding: 16, background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {response}
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#475569" }}>
        <strong>Security check:</strong> Open DevTools → Network and inspect the server function request.
        The <code>GEMINI_API_KEY</code> must not appear in any request payload or response header.
        The actual Gemini API call happens server-side only.
      </div>
    </div>
  );
}
