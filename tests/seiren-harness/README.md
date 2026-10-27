# Seiren regression harness

Drives the real app in headless Chromium (Playwright), imports audio, confirms the melody, generates every style, and dumps melody, chart and accompaniment for analysis.

## Setup

1. Serve a copy of Seiren on `http://localhost:5181/`, e.g. `python3 -m http.server 5181`.
2. Append this read-only test hook to the end of that copy's `app.js`. Do not ship it.

```js
window.__seiren={get lab(){return melodyLab;},get bars(){return bars;},render:()=>renderProtected(bars,$('pattern').value,performanceOptions(),protectionNotes()),pickup:()=>pickupBeats(),barBeats:()=>barBeats(),
 setPattern:p=>{$('pattern').value=p;$('pattern').dispatchEvent(new Event('change'));},patterns:()=>[...$('pattern').options].map(o=>o.value),styles:()=>[...$('style').options].map(o=>o.value),
 generate:(style,next=false)=>{$('style').value=style;$('style').onchange?.();applyMutation(next);},el:id=>$(id)};
```

## Scripts

- `node --test tests/seiren-harness/regressions.test.mjs` (from the repository root, Node.js 22.7+) checks harmony intervals, colour chords, all 48 styles × 3 variations, blues timing, filename metadata, loop tempo and pickup detection without external samples or Playwright.
- `node matrix.js OUT_DIR samples/*.wav` runs 48 styles × 3 variations per sample. `python3 compare.py` compares `../out/matrix` against `../out/matrix_fixed`. Edit the paths as needed.
- `python3 metrics.py OUT_DIR` prints the semitone-friction and swing tables.
- `node nohint.js OUT.json files...` records the tempo and bar 1 the app detects. Rename files so they carry no BPM, to test auto-detection.
- `node tune.mjs SEIREN_DIR SCRATCH -v` scores `chooseTempo` and `chooseDownbeat` offline against dumped features.
- `node record.js SAMPLE OUT_PREFIX original|notes STYLE PATTERN` records the real Web Audio output to `.f32`, along with `.json` metadata.

## Ground truth

Sample-library loops start on a bar line. Their filename BPM gives the beat length, and bar 1 sits at 0 s.

The original 13 Splice vocal samples and feature dumps are not bundled. The 12/13 loop-tempo acceptance target requires those inputs; the synthetic regression checks do not establish that corpus result.

## Mandarin pop and piano patterns

- `node --test tests/seiren-harness/*.test.mjs` checks the harmony/rhythm fixes and the twelve POP piano patterns, 36 original idea studies, all transpositions, phrase-end fill gating, split chords, meters and MIDI safety.
- `node tests/seiren-harness/pop-browser.cjs http://localhost:5181/` runs the real UI without a test hook: featured Mandarin pop, idea loading, repeated Generate, all 12 patterns with nonzero Web Audio output and MIDI downloads, project round-trip and mobile layout. Install Playwright in your test environment first. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` may point to an existing Chromium. `SEIREN_SCREENSHOT_DIR` optionally saves desktop/mobile evidence outside the repository.
- `seirenmelody.md` documents musical rules, source limitations and the learning workflow. Original learning PDFs remain outside the website repository.
