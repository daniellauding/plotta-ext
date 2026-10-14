// Styles for the edit-mode UI. Lives inside a shadow root, so page CSS
// cannot reach it and it cannot leak into the page.

export const PANEL_CSS = `
:host { all: initial; }
* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

.hover-box, .select-box {
  position: fixed;
  pointer-events: none;
  z-index: 2147483646;
  display: none;
}
.hover-box { outline: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.08); }
.select-box { outline: 2px solid #f97316; background: rgba(249, 115, 22, 0.06); }
.select-box.editing { outline-style: dashed; }

.hover-label {
  position: fixed;
  pointer-events: none;
  z-index: 2147483647;
  display: none;
  padding: 2px 6px;
  border-radius: 4px;
  background: #1f2937;
  color: #fff;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hover-label .size { color: #9ca3af; margin-left: 6px; }

.panel {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483647;
  width: 300px;
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #111827;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
  font-size: 12px;
  line-height: 1.4;
}
.panel.minimized .body, .panel.minimized .target-row, .panel.minimized footer { display: none; }

header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  cursor: move;
  user-select: none;
}
header .title { font-weight: 600; flex: 1; }
header .count { color: #6b7280; font-size: 11px; }

.target-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid #f3f4f6;
}
.target {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #c2410c;
  word-break: break-all;
}
.target.empty { color: #6b7280; font-family: inherit; }

.body { overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 10px; }
.body[hidden] { display: none; }

.actions { display: flex; flex-wrap: wrap; gap: 4px; }

button {
  font: inherit;
  font-size: 12px;
  padding: 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  color: #111827;
  cursor: pointer;
}
button:hover { background: #f3f4f6; }
button.danger { color: #b91c1c; }
button.active { background: #111827; color: #fff; border-color: #111827; }
button.icon { padding: 2px 6px; border: none; background: transparent; }
button:disabled { opacity: 0.4; cursor: default; }

.grid {
  display: grid;
  grid-template-columns: 78px 1fr;
  gap: 4px 8px;
  align-items: center;
}
.grid label { color: #4b5563; }
.field { display: flex; gap: 4px; align-items: center; }

input[type='text'], select, textarea {
  font: inherit;
  font-size: 12px;
  width: 100%;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #111827;
}
textarea {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  min-height: 52px;
  resize: vertical;
}
input[type='color'] {
  flex: none;
  width: 24px;
  height: 22px;
  padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: none;
  cursor: pointer;
}
input[type='range'] { width: 100%; }

.section-label { color: #4b5563; margin-bottom: 4px; display: flex; justify-content: space-between; align-items: center; }

.chips { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 4px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 2px 1px 6px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
}
.chip button { border: none; background: transparent; padding: 0 4px; color: inherit; }

details summary { cursor: pointer; color: #4b5563; }
details textarea { margin-top: 4px; }
.js-out {
  margin-top: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
}
.js-out.error { color: #b91c1c; }

footer {
  display: flex;
  gap: 4px;
  padding: 8px 10px;
  border-top: 1px solid #f3f4f6;
}
footer .spacer { flex: 1; }

.hint { color: #9ca3af; font-size: 11px; padding: 0 10px 8px; }

.toast {
  position: absolute;
  left: 50%;
  top: -34px;
  transform: translateX(-50%);
  padding: 4px 10px;
  border-radius: 6px;
  background: #111827;
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}
.toast.show { opacity: 1; }

@media (prefers-color-scheme: dark) {
  .panel { background: #111827; color: #f9fafb; border-color: #374151; }
  header, .target-row { border-color: #1f2937; }
  footer { border-color: #1f2937; }
  button { background: #1f2937; color: #f9fafb; border-color: #374151; }
  button:hover { background: #374151; }
  button.active { background: #f9fafb; color: #111827; }
  input[type='text'], select, textarea { background: #0b1220; color: #f9fafb; border-color: #374151; }
  .grid label, .section-label, details summary { color: #9ca3af; }
  .chip { background: #1e1b4b; color: #c7d2fe; }
  .target { color: #fb923c; }
  .js-out { color: #d1d5db; }
  .toast { background: #f9fafb; color: #111827; }
}
`;

// Cursor hint applied to the page while edit mode is on.
export const PAGE_CSS = `
html.plotta-edit-active, html.plotta-edit-active * { cursor: crosshair !important; }
html.plotta-edit-active [contenteditable='true'], html.plotta-edit-active [contenteditable='true'] * { cursor: text !important; }
`;
