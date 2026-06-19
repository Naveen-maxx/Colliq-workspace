const https = require("https");
const fs = require("fs");

https.get("https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&h=300&fit=crop", (res) => {
  const data = [];
  res.on("data", (chunk) => data.push(chunk));
  res.on("end", () => {
    const buffer = Buffer.concat(data);
    const base64 = buffer.toString("base64");
    fs.writeFileSync("placeholder_base64.txt", base64);
  });
});
