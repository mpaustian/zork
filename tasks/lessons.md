# Lessons

- **2026-06-11 — Playtest ergonomics, not just functional flows.** User found two UX
  bugs the automated suite missed: (1) narrator queue stalled when a new message
  arrived after the previous one finished (the "idle panel + new text" path was never
  tested — only rapid-fire queues); (2) right-click on the canvas opened Chrome's
  save-image menu (always `preventDefault` `contextmenu` in canvas games), and verbs
  executed from across the room (walk-to-act feels right in adventure games). When a
  human reports awkwardness, encode the fix as a regression test — all three got one.

- **2026-06-11 — Verify toolchain availability before planning around it.** Godot is
  NOT installed on this Linux box (user runs Godot on a separate Windows machine).
  Don't assume an engine/runtime exists locally — check `which`/`--version` first, and
  prefer stacks that can be tested headlessly here (Node/web: vitest + Playwright with
  system Chrome at /usr/bin/google-chrome).
