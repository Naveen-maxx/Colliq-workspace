import fs from 'fs';

async function test() {
  try {
    const url = "https://loremflickr.com/800/600/earth";
    console.log("Fetching from:", url);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    console.log("Successfully fetched! Base64 length:", base64.length);
    console.log("Mime type:", res.headers.get("content-type"));
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
