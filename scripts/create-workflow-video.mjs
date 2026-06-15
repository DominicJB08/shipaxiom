import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);
const mediaDir = path.resolve("public/media");
const tmpDir = path.resolve(".tmp/workflow-video");
const rawDir = path.join(tmpDir, "raw");
const rawVideo = path.join(tmpDir, "raw-workflow.webm");
const mp4Output = path.join(mediaDir, "workflow-demo.mp4");
const webmOutput = path.join(mediaDir, "workflow-demo.webm");
const posterOutput = path.join(mediaDir, "workflow-demo-poster.jpg");

await mkdir(mediaDir, { recursive: true });
await rm(tmpDir, { recursive: true, force: true });
await mkdir(rawDir, { recursive: true });

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color: #06101c;
        background: #f6f8fb;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        width: 1280px;
        height: 720px;
        overflow: hidden;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,248,251,0.94)),
          radial-gradient(circle at 82% 18%, rgba(11,114,240,0.12), transparent 32%);
      }

      .frame {
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 18px;
        width: 100%;
        height: 100%;
        padding: 34px 42px 30px;
      }

      .top {
        display: grid;
        grid-template-columns: 1fr auto;
        align-items: start;
        gap: 28px;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
        font-size: 18px;
        font-weight: 820;
      }

      .mark {
        width: 23px;
        height: 23px;
        border: 5px solid #06101c;
        border-right-color: #0b72f0;
        transform: rotate(30deg);
      }

      h1 {
        max-width: 720px;
        margin: 0;
        font-size: 42px;
        line-height: 1.02;
        letter-spacing: 0;
      }

      .result {
        display: grid;
        gap: 8px;
        min-width: 260px;
        padding: 18px 20px;
        border: 1px solid #dbe5ef;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 20px 50px rgba(6,16,28,0.1);
      }

      .result strong {
        font-size: 14px;
      }

      .result span {
        color: #087a48;
        font-size: 31px;
        font-weight: 860;
        line-height: 1;
      }

      .panels {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 18px;
        min-height: 0;
      }

      .panel {
        display: grid;
        grid-template-rows: auto auto 1fr;
        gap: 14px;
        min-width: 0;
        padding: 20px;
        border: 1px solid #dbe5ef;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 48px rgba(6,16,28,0.09);
      }

      .panel.manual {
        border-top: 5px solid #9a5c0a;
      }

      .panel.ai {
        border-top: 5px solid #0faa68;
      }

      .panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }

      h2 {
        margin: 0;
        font-size: 25px;
        line-height: 1.05;
      }

      .timer {
        display: grid;
        min-width: 116px;
        padding: 10px 12px;
        border-radius: 8px;
        background: #f4f7fa;
        text-align: right;
      }

      .timer span {
        color: #607083;
        font-size: 11px;
        font-weight: 760;
      }

      .timer strong {
        font-size: 27px;
        line-height: 1;
      }

      .screen {
        display: grid;
        grid-template-columns: 0.72fr 1fr;
        gap: 12px;
        min-height: 168px;
        padding: 14px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #fbfcfe;
      }

      .doc,
      .app {
        min-width: 0;
        padding: 12px;
        border: 1px solid #dce4ee;
        border-radius: 7px;
        background: #ffffff;
      }

      .doc h3,
      .app h3 {
        margin: 0 0 10px;
        font-size: 13px;
      }

      .line {
        height: 9px;
        margin: 7px 0;
        border-radius: 999px;
        background: #e6edf5;
      }

      .line.short { width: 64%; }
      .line.med { width: 82%; }

      .field {
        display: grid;
        grid-template-columns: 78px 1fr;
        gap: 8px;
        align-items: center;
        margin: 8px 0;
        font-size: 11px;
      }

      .field span:first-child {
        color: #6c7a8d;
      }

      .field span:last-child {
        min-height: 17px;
        border-radius: 5px;
        background: #eef3f8;
      }

      .ai .field span:last-child {
        background: #e8fff3;
      }

      .tasks {
        display: grid;
        gap: 9px;
      }

      .task {
        display: grid;
        grid-template-columns: 20px 1fr auto;
        gap: 8px;
        align-items: center;
        min-height: 33px;
        padding: 8px 10px;
        border: 1px solid #e3eaf1;
        border-radius: 7px;
        color: #415166;
        font-size: 13px;
        transition: 250ms ease;
      }

      .task b {
        display: grid;
        width: 20px;
        height: 20px;
        place-items: center;
        border-radius: 999px;
        color: #6c7a8d;
        background: #eef3f8;
        font-size: 11px;
      }

      .task em {
        color: #718096;
        font-style: normal;
        font-size: 11px;
      }

      .task.active {
        color: #06101c;
        border-color: #8ec6ff;
        background: #f1f8ff;
        transform: translateY(-1px);
      }

      .task.done {
        color: #0b603d;
        border-color: #b7edcf;
        background: #f0fff7;
      }

      .task.done b {
        color: #ffffff;
        background: #0faa68;
      }

      .caption {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 14px;
        align-items: center;
        min-height: 70px;
        padding: 14px 18px;
        border: 1px solid #cfdef0;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 16px 45px rgba(6,16,28,0.08);
      }

      .caption strong {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        border-radius: 999px;
        color: #ffffff;
        background: #0b72f0;
      }

      #captionText {
        margin: 0;
        color: #1e2d3f;
        font-size: 18px;
        line-height: 1.28;
        font-weight: 700;
      }

      .saving-pill {
        padding: 9px 12px;
        border-radius: 999px;
        color: #087a48;
        background: #e8fff3;
        font-size: 13px;
        font-weight: 820;
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <main class="frame">
      <div class="top">
        <div>
          <div class="brand"><span class="mark"></span>Ship Axiom</div>
          <h1>Example workflow: intake packet to reviewed summary</h1>
        </div>
        <div class="result">
          <strong>Time saved per packet</strong>
          <span id="saved">0 min</span>
          <small>Manual work becomes AI-assisted review</small>
        </div>
      </div>

      <section class="panels">
        <article class="panel manual">
          <div class="panel-head">
            <h2>Human-only path</h2>
            <div class="timer"><span>Elapsed</span><strong id="manualTime">0 min</strong></div>
          </div>
          <div class="screen">
            <div class="doc">
              <h3>Intake PDF</h3>
              <div class="line med"></div><div class="line"></div><div class="line short"></div>
              <div class="line med"></div><div class="line short"></div>
            </div>
            <div class="app">
              <h3>Manual copy into notes</h3>
              <div class="field"><span>Name</span><span></span></div>
              <div class="field"><span>Meds</span><span></span></div>
              <div class="field"><span>Insurance</span><span></span></div>
              <div class="field"><span>Follow-up</span><span></span></div>
            </div>
          </div>
          <div class="tasks" id="manualTasks">
            <div class="task"><b>1</b><span>Read the intake packet line by line</span><em>12 min</em></div>
            <div class="task"><b>2</b><span>Copy fields into the operating system</span><em>18 min</em></div>
            <div class="task"><b>3</b><span>Write summary and task list manually</span><em>15 min</em></div>
          </div>
        </article>

        <article class="panel ai">
          <div class="panel-head">
            <h2>Ship Axiom AI-assisted path</h2>
            <div class="timer"><span>Elapsed</span><strong id="aiTime">0 min</strong></div>
          </div>
          <div class="screen">
            <div class="doc">
              <h3>Private workspace</h3>
              <div class="line med"></div><div class="line"></div><div class="line short"></div>
              <div class="line med"></div><div class="line short"></div>
            </div>
            <div class="app">
              <h3>Draft output for review</h3>
              <div class="field"><span>Name</span><span></span></div>
              <div class="field"><span>Meds</span><span></span></div>
              <div class="field"><span>Insurance</span><span></span></div>
              <div class="field"><span>Follow-up</span><span></span></div>
            </div>
          </div>
          <div class="tasks" id="aiTasks">
            <div class="task"><b>1</b><span>AI extracts fields inside the private workspace</span><em>1 min</em></div>
            <div class="task"><b>2</b><span>AI drafts the summary and flags missing info</span><em>2 min</em></div>
            <div class="task"><b>3</b><span>Human reviews, edits, and approves output</span><em>3 min</em></div>
          </div>
        </article>
      </section>

      <section class="caption">
        <strong id="stepNumber">1</strong>
        <p id="captionText">First we map the manual workflow: where staff read, copy, summarize, and double-check sensitive information.</p>
        <span class="saving-pill" id="savingPill">Measured before automating</span>
      </section>
    </main>

    <script>
      const timeline = [
        {
          t: 0,
          step: 1,
          manual: 0,
          ai: 0,
          saved: 0,
          manualDone: 0,
          aiDone: 0,
          manualActive: 1,
          aiActive: 0,
          pill: "Measured before automating",
          caption: "First we map the manual workflow: where staff read, copy, summarize, and double-check sensitive information."
        },
        {
          t: 2800,
          step: 2,
          manual: 12,
          ai: 1,
          saved: 11,
          manualDone: 1,
          aiDone: 1,
          manualActive: 2,
          aiActive: 2,
          pill: "AI extracts fields",
          caption: "Then we build a private workflow that extracts key fields from the same packet and keeps the source visible for review."
        },
        {
          t: 5600,
          step: 3,
          manual: 30,
          ai: 3,
          saved: 27,
          manualDone: 2,
          aiDone: 2,
          manualActive: 3,
          aiActive: 3,
          pill: "Draft plus review",
          caption: "The AI drafts the summary and task list. A human still checks the output before it is used."
        },
        {
          t: 8600,
          step: 4,
          manual: 45,
          ai: 6,
          saved: 39,
          manualDone: 3,
          aiDone: 3,
          manualActive: 0,
          aiActive: 0,
          pill: "39 minutes saved",
          caption: "Outcome: the same intake packet moves from about 45 minutes of manual work to about 6 minutes of reviewed AI-assisted work."
        },
        {
          t: 11800,
          step: 5,
          manual: 45,
          ai: 6,
          saved: 39,
          manualDone: 3,
          aiDone: 3,
          manualActive: 0,
          aiActive: 0,
          pill: "Human stays in control",
          caption: "Ship Axiom sells this as a workflow: private routing, AI draft, human approval, and documented handoff."
        }
      ];

      const manualTasks = [...document.querySelectorAll("#manualTasks .task")];
      const aiTasks = [...document.querySelectorAll("#aiTasks .task")];

      function setTasks(tasks, done, active) {
        tasks.forEach((task, index) => {
          task.classList.toggle("done", index < done);
          task.classList.toggle("active", active === index + 1);
          if (index < done) task.querySelector("b").textContent = "✓";
        });
      }

      function render(state) {
        document.querySelector("#stepNumber").textContent = state.step;
        document.querySelector("#manualTime").textContent = state.manual + " min";
        document.querySelector("#aiTime").textContent = state.ai + " min";
        document.querySelector("#saved").textContent = state.saved + " min";
        document.querySelector("#savingPill").textContent = state.pill;
        document.querySelector("#captionText").textContent = state.caption;
        setTasks(manualTasks, state.manualDone, state.manualActive);
        setTasks(aiTasks, state.aiDone, state.aiActive);
      }

      const started = Date.now();
      render(timeline[0]);
      setInterval(() => {
        const elapsed = Date.now() - started;
        const state = timeline.reduce((latest, item) => elapsed >= item.t ? item : latest, timeline[0]);
        render(state);
      }, 120);
    </script>
  </body>
</html>`;

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: {
    dir: rawDir,
    size: { width: 1280, height: 720 }
  }
});

const page = await context.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(700);
await page.screenshot({ path: posterOutput, type: "jpeg", quality: 82 });
await page.waitForTimeout(12800);

const video = page.video();
await page.close();
if (!video) {
  await context.close();
  await browser.close();
  throw new Error("Playwright did not produce a video file.");
}

await video.saveAs(rawVideo);
await context.close();
await browser.close();

await execFileAsync("ffmpeg", [
  "-y",
  "-i",
  rawVideo,
  "-vf",
  "scale=960:-2",
  "-an",
  "-movflags",
  "+faststart",
  "-pix_fmt",
  "yuv420p",
  "-crf",
  "28",
  mp4Output
]);

await execFileAsync("ffmpeg", [
  "-y",
  "-i",
  rawVideo,
  "-vf",
  "scale=960:-2",
  "-an",
  "-c:v",
  "libvpx-vp9",
  "-b:v",
  "0",
  "-crf",
  "36",
  webmOutput
]);

await rm(tmpDir, { recursive: true, force: true });

console.log(JSON.stringify({ mp4Output, webmOutput, posterOutput }, null, 2));
