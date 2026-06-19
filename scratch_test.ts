// Test Pollinations.AI free image generation
import fs from "fs";

async function test() {
  const prompt = "Generate an image of earth from space";
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=600&nologo=true`;
  
  console.log("Testing Pollinations.AI...");
  console.log("URL:", url);
  
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      console.log("✅ SUCCESS! Image generated.");
      console.log("Base64 length:", base64.length);
    } else {
      console.error("❌ HTTP error:", res.status, res.statusText);
    }
  } catch (e: any) {
    console.error("❌ Fetch error:", e.message);
  }
}
test();
