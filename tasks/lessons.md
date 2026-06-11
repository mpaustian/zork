# Lessons

- **2026-06-11 — Verify toolchain availability before planning around it.** Godot is
  NOT installed on this Linux box (user runs Godot on a separate Windows machine).
  Don't assume an engine/runtime exists locally — check `which`/`--version` first, and
  prefer stacks that can be tested headlessly here (Node/web: vitest + Playwright with
  system Chrome at /usr/bin/google-chrome).
