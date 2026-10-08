// Генерация каваи-иллюстраций через OpenRouter.
// Ключ берётся только из переменной окружения — в репозиторий он не попадает.
//
//   OPENROUTER_API_KEY=... node src/generate_image.js out.png "prompt" [reference.jpg ...] [--model id]
const fs = require("fs");
const path = require("path");

const DEFAULT_MODEL = "google/gemini-2.5-flash-image";

async function generate({ prompt, out, refs = [], model = DEFAULT_MODEL }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("Set OPENROUTER_API_KEY");

  const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
  const content = [{ type: "text", text: prompt }];
  for (const ref of refs) {
    const b64 = fs.readFileSync(ref).toString("base64");
    content.push({ type: "image_url", image_url: { url: `data:${mime[path.extname(ref).toLowerCase()]};base64,${b64}` } });
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, modalities: ["image", "text"], messages: [{ role: "user", content }] }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data).slice(0, 500)}`);

  const url = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) throw new Error("No image in response: " + JSON.stringify(data).slice(0, 500));
  fs.writeFileSync(out, Buffer.from(url.split(",")[1], "base64"));
  return { out, cost: data.usage?.cost };
}

module.exports = { generate };

if (require.main === module) {
  const args = process.argv.slice(2);
  const mi = args.indexOf("--model");
  const model = mi >= 0 ? args.splice(mi, 2)[1] : DEFAULT_MODEL;
  const [out, prompt, ...refs] = args;
  generate({ prompt, out, refs, model })
    .then((r) => console.log("Saved", r.out, r.cost != null ? `($${r.cost})` : ""))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
