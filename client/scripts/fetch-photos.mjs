// Photo tooling for the site (Pexels licence: free to use, no attribution required — we credit anyway).
//
//   Search:  PEXELS_API_KEY=… node scripts/fetch-photos.mjs search
//            → downloads candidates for every slot into scripts/.photo-candidates/<slot>/ for review
//   Choose:  PEXELS_API_KEY=… node scripts/fetch-photos.mjs use hero=123456 screening=789012 …
//            → downloads the chosen photos, converts them to WebP in public/images/ (needs `cwebp`)
//              and writes the credits to src/data/photoCredits.json
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const KEY = process.env.PEXELS_API_KEY;
if (!KEY) {
  console.error("Set PEXELS_API_KEY (https://www.pexels.com/api/).");
  process.exit(1);
}

const root = path.resolve(import.meta.dirname, "..");
const candidatesDir = path.join(root, "scripts/.photo-candidates");
const imagesDir = path.join(root, "public/images");
const creditsFile = path.join(root, "src/data/photoCredits.json");

// slot → { queries, orientation, width of the final image }
const SLOTS = {
  hero: { queries: ["mother holding newborn baby window light", "mother cuddling baby home"], orientation: "portrait", width: 1200 },
  screening: { queries: ["midwife talking with new mother", "nurse consultation mother baby"], orientation: "landscape", width: 1200 },
  companion: { queries: ["mother with baby looking at phone", "new mother smartphone sofa baby"], orientation: "landscape", width: 1200 },
  specialists: { queries: ["female doctor video call", "doctor talking to patient clinic europe"], orientation: "landscape", width: 1200 },
  programme: { queries: ["mother pushing stroller park", "mother walking with baby carrier nature"], orientation: "landscape", width: 1200 },
  about: { queries: ["midwife holding newborn hospital", "nurse with newborn baby maternity ward"], orientation: "portrait", width: 1000 },
  article: { queries: ["tired mother newborn", "mother resting with baby on bed"], orientation: "landscape", width: 1400 },
  articleSupport: { queries: ["parents with newborn baby home", "family with baby smiling living room"], orientation: "landscape", width: 1400 },
  empty: { queries: ["friendly doctor portrait smiling", "nurse portrait smiling hospital"], orientation: "square", width: 400 },
};

async function pexels(url) {
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text()}`);
  return res.json();
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function search() {
  for (const [slot, { queries, orientation }] of Object.entries(SLOTS)) {
    const dir = path.join(candidatesDir, slot);
    fs.mkdirSync(dir, { recursive: true });
    const seen = new Set();
    for (const query of queries) {
      const data = await pexels(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${orientation}&per_page=6`,
      );
      for (const photo of data.photos) {
        if (seen.has(photo.id)) continue;
        seen.add(photo.id);
        await download(photo.src.medium, path.join(dir, `${photo.id}.jpg`));
        fs.appendFileSync(
          path.join(dir, "index.txt"),
          `${photo.id}\t${photo.photographer}\t${photo.alt}\t${photo.url}\n`,
        );
      }
    }
    console.log(`${slot}: ${seen.size} candidates`);
  }
}

async function use(choices) {
  const credits = fs.existsSync(creditsFile) ? JSON.parse(fs.readFileSync(creditsFile, "utf8")) : {};
  fs.mkdirSync(imagesDir, { recursive: true });
  for (const choice of choices) {
    const [slot, id] = choice.split("=");
    if (!SLOTS[slot]) throw new Error(`Unknown slot ${slot}`);
    const photo = await pexels(`https://api.pexels.com/v1/photos/${id}`);
    const tmp = path.join(candidatesDir, `${slot}-${id}-original.jpg`);
    await download(photo.src.original, tmp);
    const out = path.join(imagesDir, `${slot === "articleSupport" ? "article-support" : slot === "empty" ? "consultation-empty" : slot}.webp`);
    execFileSync("cwebp", ["-quiet", "-q", "80", "-resize", String(SLOTS[slot].width), "0", tmp, "-o", out]);
    credits[slot] = { id: photo.id, photographer: photo.photographer, photographerUrl: photo.photographer_url, url: photo.url };
    console.log(`${slot} ← ${photo.id} by ${photo.photographer}`);
  }
  fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2) + "\n");
}

const [command, ...args] = process.argv.slice(2);
if (command === "search") await search();
else if (command === "use") await use(args);
else console.log("Usage: fetch-photos.mjs search | use slot=id …");
