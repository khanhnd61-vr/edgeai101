# Edge AI 101

A 75-slide self-study course on running neural networks on edge devices: why models must
run on the device, quantization, knowledge distillation, pruning, efficient architectures and
architecture search, kernels and runtimes, and how they combine for LLMs, VLMs and VLAs.

Live at https://khanhnd61-vr.github.io/edgeai101/

There is no build step: open `index.html`, or serve the folder with any static server.

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

| Path | What it holds |
|---|---|
| `index.html` | The 75 slides, one `<section>` each, and the toolbar |
| `assets/deck.css` | The look of the slides and their entrance animations |
| `assets/viewer.css` | The page around the slides: stage, element defaults, connectors and icons, toolbar |
| `assets/viewer.js` | Paging, scaling to the window, drawing connectors and icons, and restarting a slide's animations when it is shown |

## Reading it

| Key | Action |
|---|---|
| → ↓ Space Enter PageDown | Next slide |
| ← ↑ Backspace PageUp | Previous slide |
| Home / End | First / last slide |
| R | Replay the current slide's animations |
| F | Full screen |

A slide's address is `#slide-N`, so `…/edgeai101/#slide-14` opens the core idea of quantization.

## Parts

| Slides | Part |
|---|---|
| 1–2 | Introduction |
| 3–11 | 1 · Background |
| 12–27 | 2 · Quantization |
| 28–35 | 3 · Distillation |
| 36–44 | 4 · Pruning |
| 45–52 | 5 · Architectures and NAS |
| 53–63 | 6 · Kernels and runtimes |
| 64–75 | 7 · LLM, VLM, VLA on the edge |

## Editing a slide

Each slide is plain HTML on a 1920 × 1080 canvas. Two elements are drawn by `assets/viewer.js`:

- `<x-connector x1 y1 x2 y2>` is a line with an arrow head, in the pixel coordinates of its
  positioned parent. `route="hv|vh|elbow"` bends it, `head="both|none"` changes the heads, and
  its `color`, `border-width` and `border-style: dashed` set the stroke. Without coordinates it
  is a flow arrow that runs across its own box.
- `<x-icon name>` is a line glyph in the element's colour; the names are listed in `viewer.js`.

Entrance animations are the classes at the end of `assets/deck.css` (`af`, `ar-in`, `as`, `ap`,
`gy`, `gx`), staged with `style="--i:N"`. Moving parts inside drawings are SVG `<animate>` and
`<animateMotion>` elements.
