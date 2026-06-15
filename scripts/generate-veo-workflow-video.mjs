import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);

const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
const model = process.env.VEO_MODEL || "veo-3.1-fast-generate-preview";
const mediaDir = path.resolve("public/media");
const tmpDir = path.resolve(".tmp/veo-workflow-video");
const rawDir = path.join(tmpDir, "raw");
const clipsDir = path.join(tmpDir, "clips");
const compositionHtml = path.join(tmpDir, "composition.html");
const manualClip = path.join(clipsDir, "manual-admin.mp4");
const aiClip = path.join(clipsDir, "ai-assisted.mp4");
const rawComposition = path.join(tmpDir, "raw-composition.webm");
const mp4Output = path.join(mediaDir, "workflow-demo.mp4");
const webmOutput = path.join(mediaDir, "workflow-demo.webm");
const posterOutput = path.join(mediaDir, "workflow-demo-poster.jpg");

const renderWidth = 1280;
const renderHeight = 720;
const compositionMs = 18800;

const clipSpecs = [
  {
    name: "manual",
    file: manualClip,
    prompt:
      "Cinematic realistic B2B operations footage for a premium SaaS landing page. Close-up of adult office worker hands manually sorting an intake packet on a desk, switching between paper forms, a spreadsheet-like screen, email-like windows, sticky notes, and a laptop. Repeated copy-paste body language, paper shuffle, analog clock blur, slow tense dolly push, warm amber office light, shallow depth of field, high-end commercial style. No readable text, no logos, no brand names, no faces, no minors, no medical records. Audio cues: quiet keyboard taps, paper shuffle, ticking clock, soft office hum."
  },
  {
    name: "ai",
    file: aiClip,
    prompt:
      "Cinematic realistic B2B operations footage for a premium SaaS landing page. An intake packet rests beside a laptop as abstract blue and green data streams flow from the document into a clean private workflow dashboard. Fields organize automatically, a review checklist glows, and an adult hand clicks approve. Smooth confident camera orbit, energetic teal light, premium commercial style, clean glass UI reflections. No readable text, no logos, no brand names, no faces, no minors, no medical records. Audio cues: soft digital whoosh, confident click, gentle office hum."
  }
];

await mkdir(mediaDir, { recursive: true });
await mkdir(rawDir, { recursive: true });
await mkdir(clipsDir, { recursive: true });

const apiKey = await getApiKey();

for (const clip of clipSpecs) {
  if (existsSync(clip.file) && !process.argv.includes("--force")) {
    console.log(`Using existing ${clip.name} clip at ${clip.file}`);
    continue;
  }

  console.log(`Generating ${clip.name} clip with ${model}...`);
  await generateVeoClip(clip.prompt, clip.file);
}

await composeEditedVideo();
await encodeOutputs();

console.log(JSON.stringify({ mp4Output, webmOutput, posterOutput, model }, null, 2));

async function getApiKey() {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }

  const localKeyPath = path.resolve(".tmp/gemini_api_key");
  if (existsSync(localKeyPath)) {
    return (await readFile(localKeyPath, "utf8")).trim();
  }

  throw new Error("Set GEMINI_API_KEY or place the key at .tmp/gemini_api_key.");
}

async function generateVeoClip(prompt, outputPath) {
  const createJson = await startVeoOperation(prompt);

  if (!createJson.name) {
    throw new Error(`Veo request did not return an operation name: ${JSON.stringify(createJson)}`);
  }

  const operationName = createJson.name;
  const started = Date.now();

  while (Date.now() - started < 8 * 60 * 1000) {
    await sleep(10_000);

    const statusResponse = await fetch(`${baseUrl}/${operationName}`, {
      headers: { "x-goog-api-key": apiKey }
    });
    const statusJson = await statusResponse.json();
    if (!statusResponse.ok || statusJson.error) {
      throw new Error(`Veo status failed: ${JSON.stringify(statusJson.error || statusJson)}`);
    }

    console.log(`${path.basename(outputPath)}: ${statusJson.done ? "complete" : "waiting"}`);
    if (!statusJson.done) {
      continue;
    }

    const sample = statusJson.response?.generateVideoResponse?.generatedSamples?.[0];
    const video = sample?.video;
    if (video?.uri) {
      await downloadFile(video.uri, outputPath);
      return;
    }

    if (video?.bytesBase64Encoded) {
      await writeFile(outputPath, Buffer.from(video.bytesBase64Encoded, "base64"));
      return;
    }

    throw new Error(`Veo operation completed without a video URI: ${JSON.stringify(statusJson)}`);
  }

  throw new Error(`Timed out waiting for Veo operation ${operationName}.`);
}

async function startVeoOperation(prompt) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const createResponse = await fetch(`${baseUrl}/models/${model}:predictLongRunning`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          aspectRatio: "16:9",
          durationSeconds: 6,
          resolution: "720p"
        }
      })
    });

    const createJson = await createResponse.json();
    if (createResponse.ok && !createJson.error) {
      return createJson;
    }

    lastError = createJson.error || createJson;
    const retryable = createResponse.status === 429 || createResponse.status >= 500;
    if (!retryable || attempt === 4) {
      break;
    }

    console.log(`Veo start failed with ${createResponse.status}; retrying attempt ${attempt + 1}/4...`);
    await sleep(10_000 * attempt);
  }

  throw new Error(`Veo request failed: ${JSON.stringify(lastError)}`);
}

async function downloadFile(url, outputPath) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "x-goog-api-key": apiKey }
  });
  if (!response.ok) {
    throw new Error(`Failed to download generated video: ${response.status} ${response.statusText}`);
  }

  await writeFile(outputPath, Buffer.from(await response.arrayBuffer()));
}

async function composeEditedVideo() {
  await rm(rawDir, { recursive: true, force: true });
  await mkdir(rawDir, { recursive: true });

  const html = buildCompositionHtml({
    manualSrc: pathToFileURL(manualClip).href,
    aiSrc: pathToFileURL(aiClip).href
  });
  await writeFile(compositionHtml, html);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: renderWidth, height: renderHeight },
    recordVideo: {
      dir: rawDir,
      size: { width: renderWidth, height: renderHeight }
    }
  });

  const page = await context.newPage();
  await page.goto(pathToFileURL(compositionHtml).href, { waitUntil: "load" });
  await page.waitForFunction(() => window.shipAxiomReady === true, null, { timeout: 20_000 });
  await page.evaluate(() => window.startShipAxiomComposition());
  await page.waitForTimeout(13_300);
  await page.screenshot({ path: posterOutput, type: "jpeg", quality: 86 });
  await page.waitForTimeout(compositionMs - 13_300 + 700);

  const video = page.video();
  await page.close();
  if (!video) {
    await context.close();
    await browser.close();
    throw new Error("Playwright did not produce a composition video.");
  }

  await video.saveAs(rawComposition);
  await context.close();
  await browser.close();
}

async function encodeOutputs() {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    rawComposition,
    "-vf",
    "scale=960:-2,fps=24",
    "-an",
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    "-crf",
    "26",
    mp4Output
  ]);

  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    rawComposition,
    "-vf",
    "scale=960:-2,fps=24",
    "-an",
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "34",
    webmOutput
  ]);
}

function buildCompositionHtml({ manualSrc, aiSrc }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>
      :root {
        --ink: #f8fbff;
        --muted: rgba(248, 251, 255, 0.72);
        --blue: #48a2ff;
        --green: #35d994;
        --amber: #f6a84b;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        width: ${renderWidth}px;
        height: ${renderHeight}px;
        overflow: hidden;
        color: var(--ink);
        background: #06101c;
      }

      .stage {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #06101c;
      }

      video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transform: scale(1.03);
        filter: saturate(1.05) contrast(1.05);
        transition: opacity 520ms ease, transform 4200ms ease;
      }

      .phase-manual .manual-video,
      .phase-ai .ai-video {
        opacity: 1;
        transform: scale(1.08);
      }

      .phase-summary .manual-video,
      .phase-summary .ai-video {
        opacity: 0.78;
        transform: scale(1.05);
      }

      .phase-summary .manual-video {
        clip-path: inset(0 50% 0 0);
      }

      .phase-summary .ai-video {
        clip-path: inset(0 0 0 50%);
      }

      .wash {
        position: absolute;
        inset: 0;
        background:
          linear-gradient(90deg, rgba(6, 16, 28, 0.82) 0%, rgba(6, 16, 28, 0.42) 42%, rgba(6, 16, 28, 0.72) 100%),
          radial-gradient(circle at 78% 22%, rgba(72, 162, 255, 0.36), transparent 30%),
          radial-gradient(circle at 26% 78%, rgba(53, 217, 148, 0.18), transparent 34%);
      }

      .scan {
        position: absolute;
        inset: -20% -10%;
        background: linear-gradient(115deg, transparent 0 42%, rgba(255, 255, 255, 0.2) 49%, transparent 56% 100%);
        mix-blend-mode: screen;
        opacity: 0.34;
        transform: translateX(-80%);
        animation: sweep 3.4s ease-in-out infinite;
      }

      @keyframes sweep {
        0% { transform: translateX(-88%); }
        50% { transform: translateX(26%); }
        100% { transform: translateX(88%); }
      }

      .brand {
        position: absolute;
        top: 34px;
        left: 42px;
        z-index: 4;
        display: inline-flex;
        align-items: center;
        gap: 12px;
        font-size: 18px;
        font-weight: 820;
      }

      .mark {
        width: 24px;
        height: 24px;
        border: 5px solid #ffffff;
        border-right-color: var(--blue);
        transform: rotate(30deg);
      }

      .headline {
        position: absolute;
        left: 42px;
        bottom: 54px;
        z-index: 4;
        width: 590px;
      }

      .headline small {
        display: inline-flex;
        margin-bottom: 15px;
        padding: 8px 11px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 999px;
        color: var(--muted);
        background: rgba(6, 16, 28, 0.4);
        font-size: 13px;
        font-weight: 760;
      }

      .headline h1 {
        margin: 0;
        font-size: 54px;
        line-height: 0.97;
        letter-spacing: 0;
      }

      .headline p {
        width: 500px;
        margin: 18px 0 0;
        color: var(--muted);
        font-size: 19px;
        line-height: 1.42;
      }

      .status {
        position: absolute;
        top: 42px;
        right: 42px;
        z-index: 4;
        display: grid;
        grid-template-columns: repeat(3, 120px);
        gap: 10px;
        opacity: 1;
        transition: opacity 420ms ease, transform 420ms ease;
      }

      .stat {
        padding: 14px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        background: rgba(6, 16, 28, 0.58);
        backdrop-filter: blur(18px);
      }

      .stat strong {
        display: block;
        color: #ffffff;
        font-size: 26px;
        line-height: 1;
      }

      .stat span {
        display: block;
        margin-top: 7px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 720;
      }

      .path-card {
        position: absolute;
        right: 42px;
        bottom: 44px;
        z-index: 4;
        width: 390px;
        padding: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(6, 16, 28, 0.62);
        backdrop-filter: blur(22px);
        opacity: 1;
        transition: opacity 420ms ease, transform 420ms ease;
      }

      .path-card h2 {
        margin: 0 0 14px;
        font-size: 21px;
      }

      .step {
        display: grid;
        grid-template-columns: 24px 1fr;
        gap: 10px;
        align-items: center;
        min-height: 34px;
        color: var(--muted);
        font-size: 14px;
      }

      .step b {
        display: grid;
        width: 24px;
        height: 24px;
        place-items: center;
        border-radius: 999px;
        color: #071321;
        background: #ffffff;
        font-size: 12px;
      }

      .phase-manual .manual-copy,
      .phase-ai .ai-copy,
      .phase-summary .summary-copy {
        opacity: 1;
        transform: translateY(0);
      }

      .phase-summary .status,
      .phase-summary .path-card {
        opacity: 0;
        transform: translateY(-12px);
      }

      .copy {
        position: absolute;
        inset: auto auto 0 0;
        opacity: 0;
        transform: translateY(18px);
        transition: opacity 440ms ease, transform 440ms ease;
      }

      .summary-grid {
        position: absolute;
        inset: 96px 42px 112px;
        z-index: 4;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 22px;
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 520ms ease, transform 520ms ease;
      }

      .phase-summary .summary-grid {
        opacity: 1;
        transform: translateY(0);
      }

      .summary-panel {
        position: relative;
        display: grid;
        align-content: end;
        min-height: 390px;
        padding: 24px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: linear-gradient(180deg, transparent, rgba(6, 16, 28, 0.78));
        overflow: hidden;
      }

      .summary-panel h2 {
        margin: 0;
        font-size: 32px;
        line-height: 1;
      }

      .summary-panel p {
        max-width: 440px;
        margin: 12px 0 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.38;
      }

      .time-pill {
        position: absolute;
        top: 22px;
        right: 22px;
        padding: 11px 14px;
        border-radius: 8px;
        color: #071321;
        background: #ffffff;
        font-size: 27px;
        font-weight: 860;
      }

      .summary-panel.ai {
        border-color: rgba(53, 217, 148, 0.42);
      }

      .summary-panel.ai .time-pill {
        background: #dfffee;
      }

      .final-banner {
        position: absolute;
        left: 50%;
        bottom: 38px;
        z-index: 5;
        width: 460px;
        margin-left: -230px;
        padding: 15px 18px;
        border-radius: 8px;
        color: #071321;
        background: #ffffff;
        text-align: center;
        font-size: 24px;
        font-weight: 860;
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 520ms ease, transform 520ms ease;
      }

      .phase-summary .final-banner {
        opacity: 1;
        transform: translateY(0);
      }
    </style>
  </head>
  <body class="phase-manual">
    <main class="stage">
      <video class="manual-video" muted playsinline loop preload="auto" src="${manualSrc}"></video>
      <video class="ai-video" muted playsinline loop preload="auto" src="${aiSrc}"></video>
      <div class="wash"></div>
      <div class="scan"></div>
      <div class="brand"><span class="mark"></span>Ship Axiom</div>
      <div class="status">
        <div class="stat"><strong id="manualStat">45</strong><span>manual minutes</span></div>
        <div class="stat"><strong id="aiStat">6</strong><span>assisted minutes</span></div>
        <div class="stat"><strong id="savedStat">39</strong><span>minutes saved</span></div>
      </div>

      <section class="headline">
        <div class="copy manual-copy">
          <small>Human-only workflow</small>
          <h1>Read. Copy. Rewrite. Check again.</h1>
          <p>Staff move information by hand across forms, inboxes, spreadsheets, and operating systems.</p>
        </div>
        <div class="copy ai-copy">
          <small>Ship Axiom workflow</small>
          <h1>Extract. Draft. Route for approval.</h1>
          <p>Private AI prepares the structured output while humans keep the final approval step.</p>
        </div>
      </section>

      <aside class="path-card">
        <h2>What changes</h2>
        <div class="step"><b>1</b><span>Map the manual intake path</span></div>
        <div class="step"><b>2</b><span>Build a private extraction workflow</span></div>
        <div class="step"><b>3</b><span>Review, edit, and approve the result</span></div>
      </aside>

      <section class="summary-grid" aria-label="manual versus AI comparison">
        <article class="summary-panel">
          <span class="time-pill">45 min</span>
          <h2>Human-only path</h2>
          <p>Manual reading, copying, and rewriting stays slow and hard to audit.</p>
        </article>
        <article class="summary-panel ai">
          <span class="time-pill">6 min</span>
          <h2>AI-assisted path</h2>
          <p>The same packet becomes a reviewed summary, structured fields, and a clear task list.</p>
        </article>
      </section>
      <div class="final-banner">39 minutes saved per packet</div>
    </main>
    <script>
      window.shipAxiomReady = false;
      const videos = [...document.querySelectorAll("video")];
      const body = document.body;

      function setPhase(phase) {
        body.className = "phase-" + phase;
      }

      window.startShipAxiomComposition = async function startShipAxiomComposition() {
        await Promise.all(videos.map(async (video) => {
          video.currentTime = 0;
          await video.play();
        }));

        const start = performance.now();
        function tick(now) {
          const elapsed = now - start;
          if (elapsed < 6400) setPhase("manual");
          else if (elapsed < 12600) setPhase("ai");
          else setPhase("summary");
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      };

      Promise.all(videos.map((video) => new Promise((resolve) => {
        if (video.readyState >= 3) resolve();
        else video.addEventListener("canplay", resolve, { once: true });
      }))).then(() => {
        window.shipAxiomReady = true;
      });
    </script>
  </body>
</html>`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
