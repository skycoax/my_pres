// Перенос движения из видео на своих персонажей через OpenRouter (Seedance 2.5),
// по аналогии с Higgsfield «Motion Transfer».
// Ключ берётся только из переменной окружения — в репозиторий он не попадает.
//
//   OPENROUTER_API_KEY=... NODE_USE_ENV_PROXY=1 node src/generate_video.js \
//     --video ref.mp4 --main main.jpg [--crowd crowd.jpg] [--out result.mp4]
//     [--resolution 480p] [--aspect 16:9] [--parts 1] [--seed 42] [--prompt-file p.txt]
//     --video-url https://.../ref0.mp4[,https://.../ref1.mp4] [--keep-refs DIR]
//     [--model bytedance/seedance-2.5] [--dry-run]
//
// Что делает:
//  1. ffmpeg-ом обрезает исходник под выбранное соотношение сторон (убирает боковые рамки),
//     ужимает до 480p/24 fps — референс меньше, запрос дешевле и быстрее грузится.
//     Видео OpenRouter берёт только по публичной HTTPS-ссылке: сначала --dry-run --keep-refs DIR,
//     заливаешь полученные ref*.mp4 куда угодно (прямая ссылка на .mp4) и передаёшь --video-url.
//  2. Отправляет в POST /api/v1/videos: видео-референс (движение, камера, тайминг)
//     + фото главного героя (+ фото для толпы).
//  3. Ждёт готовности, скачивает и накладывает оригинальный звук из исходника.
// --parts 2 режет ролик на куски (если модель откажется брать 28 сек за раз);
// каждый следующий кусок стартует с последнего кадра предыдущего, затем всё склеивается.
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

const API = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "bytedance/seedance-2.5";
const FPS = 24;
// Размеры кадра Seedance 2.5 (из /api/v1/videos/models → supported_sizes)
const SIZES = {
  "480p": { "16:9": [854, 480], "21:9": [992, 432], "4:3": [752, 560], "1:1": [640, 640], "9:16": [480, 854] },
  "720p": { "16:9": [1280, 720], "21:9": [1470, 630], "4:3": [1112, 834], "1:1": [960, 960], "9:16": [720, 1280] },
};
const PRICE_PER_TOKEN_WITH_VIDEO_INPUT = 6.4e-6; // Seedance 2.5: $ за видео-токен, когда на входе есть видео
// Модели с оплатой за секунду при видео-референсе ($/сек, из /api/v1/videos/models → pricing_skus)
const PRICE_PER_SECOND = { "heygen/heygen-video-1": { "480p": 0.04, "768p": 0.06, "2K": 0.18 } };

const PROMPT = ({ crowd }) => `Recreate video 1 exactly: same motion, choreography, timing, rhythm, camera angle, camera movement, framing, cuts and crowd formation. Change only who the people are.

MAIN CHARACTER: the single central figure of video 1 (the one who stands out from the crowd) becomes the person from image 1. Keep image 1's face, facial features, hairstyle and skin tone identical in every frame, including close-ups. He performs only the movements of the original central figure.
${crowd ? `
CROWD: every surrounding person becomes the person from image 2, with the same face and appearance. Image 2 is never applied to the main character, image 1 is never applied to the crowd.
` : `
CROWD: keep the surrounding people as in video 1. Image 1 is never applied to the crowd.
`}
The crowd performs exactly the same synchronized group movements as in video 1. Keep the same number of people, their positions, spacing and depth. No new gestures, no new camera moves, no added or removed people.

Photorealistic, natural lighting and shadows, realistic anatomy, stable faces and clothing from frame to frame, no flicker, no morphing, no duplicated or merged bodies.`;

function parseArgs(argv) {
  const opts = { resolution: "480p", aspect: "16:9", parts: 1, model: DEFAULT_MODEL, out: "result.mp4" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") { opts.dryRun = true; continue; }
    if (!a.startsWith("--")) throw new Error(`Unknown argument: ${a}`);
    const key = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    opts[key] = argv[++i];
  }
  opts.parts = Number(opts.parts);
  if (opts.seed != null) opts.seed = Number(opts.seed);
  if (!opts.video || !opts.main) throw new Error("Need at least --video ref.mp4 --main main.jpg");
  if (!SIZES[opts.resolution]?.[opts.aspect]) throw new Error(`Unsupported --resolution/--aspect: ${opts.resolution} ${opts.aspect}`);
  return opts;
}

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
const ffmpeg = (args) => run("ffmpeg", ["-v", "error", "-y", ...args]);
const probeDuration = (file) => Number(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]));
const hasAudio = (file) => run("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file]) !== "";

function dataUrl(file) {
  const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4" };
  const type = mime[path.extname(file).toLowerCase()];
  if (!type) throw new Error(`Unsupported file type: ${file}`);
  return `data:${type};base64,${fs.readFileSync(file).toString("base64")}`;
}

// Центр-кроп под нужное соотношение (у исходника 2340×1080 по бокам рамки, внутри ровно 16:9),
// масштаб до размера выходного кадра, 24 fps, без звука.
function prepareReference(src, dst, { start, duration, size: [w, h] }) {
  ffmpeg([
    "-ss", String(start), "-t", String(duration), "-i", src,
    "-vf", `crop='min(iw,ih*${w}/${h})':'min(ih,iw*${h}/${w})',scale=${w}:${h}:flags=lanczos,setsar=1,fps=${FPS}`,
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", dst,
  ]);
}

async function api(method, url, key, body) {
  const res = await fetch(url.startsWith("http") ? url : new URL(url, "https://openrouter.ai"), {
    method,
    headers: { Authorization: `Bearer ${key}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}: ${text.slice(0, 1000)}`);
  return JSON.parse(text);
}

async function waitForVideo(job, key) {
  const started = Date.now();
  let last = "";
  while (!["completed", "failed", "cancelled", "expired"].includes(job.status)) {
    if (Date.now() - started > 60 * 60 * 1000) throw new Error(`Job ${job.id} is still ${job.status} after 60 min`);
    await new Promise((r) => setTimeout(r, 15_000));
    job = await api("GET", job.polling_url, key);
    if (job.status !== last) console.log(`  ${new Date().toLocaleTimeString()} ${job.status}`);
    last = job.status;
  }
  if (job.status !== "completed") throw new Error(`Job ${job.id} ${job.status}: ${job.error ?? "no details"}`);
  return job;
}

async function download(job, key, dst) {
  const url = job.unsigned_urls?.[0] ?? `${API}/videos/${job.id}/content?index=0`;
  const res = await fetch(url, { headers: url.startsWith(API) ? { Authorization: `Bearer ${key}` } : {} });
  if (!res.ok) throw new Error(`Download ${url} → ${res.status}: ${await res.text()}`);
  fs.writeFileSync(dst, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const key = process.env.OPENROUTER_API_KEY;
  if (!key && !opts.dryRun) throw new Error("Set OPENROUTER_API_KEY");
  const videoUrls = opts.videoUrl ? opts.videoUrl.split(",") : [];

  const size = SIZES[opts.resolution][opts.aspect];
  const total = Math.round(probeDuration(opts.video));
  // Seedance 2.5 принимает целую длительность 4–30 сек
  const lens = Array.from({ length: opts.parts }, (_, i) =>
    Math.floor(total / opts.parts) + (i < total % opts.parts ? 1 : 0));
  if (lens.some((l) => l < 4 || l > 30)) throw new Error(`Part lengths ${lens} must be within 4..30 s — change --parts`);
  if (!opts.dryRun && videoUrls.length !== lens.length) {
    throw new Error(`OpenRouter takes reference videos only as public HTTPS URLs. Run with --dry-run --keep-refs DIR, ` +
      `upload the ${lens.length} prepared clip(s) and pass them as --video-url url1[,url2]`);
  }

  const perSecond = PRICE_PER_SECOND[opts.model]?.[opts.resolution];
  const estimate = perSecond
    ? total * perSecond
    : lens.reduce((s, l) => s + (size[0] * size[1] * FPS * l) / 1024, 0) * PRICE_PER_TOKEN_WITH_VIDEO_INPUT;
  console.log(`${opts.model}, ${size.join("×")} (${opts.resolution} ${opts.aspect}), ${total} s in ${opts.parts} part(s): ${lens.join(" + ")} s`);
  console.log(`Estimated cost ≈ $${estimate.toFixed(2)} per attempt (actual cost is reported after generation)`);

  const prompt = opts.promptFile ? fs.readFileSync(opts.promptFile, "utf8") : PROMPT({ crowd: !!opts.crowd });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "motion-"));
  try {
    await generate(opts, { key, size, lens, prompt, tmp, videoUrls });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function generate(opts, { key, size, lens, prompt, tmp, videoUrls }) {
  const outParts = [];
  let spent = 0;
  let start = 0;
  let firstFrame = null;

  for (let i = 0; i < lens.length; i++) {
    const ref = path.join(tmp, `ref${i}.mp4`);
    prepareReference(opts.video, ref, { start, duration: lens[i], size });
    if (opts.keepRefs) fs.copyFileSync(ref, path.join(opts.keepRefs, `ref${i}.mp4`));
    console.log(`\nPart ${i + 1}/${lens.length}: ${start}–${start + lens[i]} s, reference ${(fs.statSync(ref).size / 1e6).toFixed(1)} MB`);

    const body = {
      model: opts.model,
      prompt,
      duration: lens[i],
      resolution: opts.resolution,
      aspect_ratio: opts.aspect,
      // звук берём из оригинала — он совпадает с таймингом; HeyGen звук не отключает
      ...(opts.model.startsWith("heygen/") ? {} : { generate_audio: false }),
      input_references: [
        { type: "image_url", image_url: { url: dataUrl(opts.main) } }, // image 1 — главный герой
        ...(opts.crowd ? [{ type: "image_url", image_url: { url: dataUrl(opts.crowd) } }] : []), // image 2 — толпа
        // video 1 — движение и камера. OpenRouter принимает видео только по HTTPS-ссылке (не base64)
        { type: "video_url", video_url: { url: videoUrls[i] ?? "https://example.com/ref.mp4" } },
      ],
      ...(firstFrame ? { frame_images: [{ type: "image_url", frame_type: "first_frame", image_url: { url: dataUrl(firstFrame) } }] } : {}),
      ...(opts.seed != null ? { seed: opts.seed } : {}),
    };

    if (opts.dryRun) {
      const short = JSON.stringify(body, (k, v) => (typeof v === "string" && v.startsWith("data:") ? v.slice(0, 40) + "…" : v), 2);
      console.log(short);
      start += lens[i];
      continue;
    }

    let job = await api("POST", `${API}/videos`, key, body);
    console.log(`  job ${job.id} submitted`);
    job = await waitForVideo(job, key);
    const part = path.join(tmp, `out${i}.mp4`);
    await download(job, key, part);
    spent += job.usage?.cost ?? 0;
    console.log(`  done${job.usage?.cost != null ? `, cost $${job.usage.cost}` : ""}`);
    outParts.push(part);

    if (i < lens.length - 1) {
      firstFrame = path.join(tmp, `last${i}.png`);
      ffmpeg(["-sseof", "-0.1", "-i", part, "-frames:v", "1", "-update", "1", firstFrame]);
    }
    start += lens[i];
  }
  if (opts.dryRun) return;

  // Склейка кусков + оригинальный звук
  let video = outParts[0];
  if (outParts.length > 1) {
    const list = path.join(tmp, "list.txt");
    fs.writeFileSync(list, outParts.map((p) => `file '${p}'`).join("\n"));
    video = path.join(tmp, "joined.mp4");
    ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-an", video]);
  }
  if (hasAudio(opts.video)) {
    ffmpeg(["-i", video, "-i", opts.video, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", opts.out]);
  } else {
    fs.copyFileSync(video, opts.out);
  }
  console.log(`\nSaved ${opts.out}${spent ? ` (total $${spent.toFixed(2)})` : ""}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
