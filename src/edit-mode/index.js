// Plotta edit mode: click any element on the page to delete, hide,
// duplicate, edit text or tweak its CSS. Injected on demand by the
// background service worker (keyboard shortcut / context menu).
// Injecting it again toggles the mode.

import { getSelector, describe } from './selector.js';
import { ChangeTracker, setAttr } from './changes.js';
import { PANEL_CSS, PAGE_CSS } from './styles.js';

const HOST_TAG = 'plotta-edit-mode';
const PAGE_STYLE_ID = 'plotta-edit-mode-page-style';
const ACTIVE_CLASS = 'plotta-edit-active';
const TARGET_ATTR = 'data-plotta-edit-target';

const STYLE_FIELDS = [
  { prop: 'color', label: 'Text colour', color: true },
  { prop: 'background-color', label: 'Background', color: true },
  { prop: 'font-size', label: 'Font size' },
  { prop: 'padding', label: 'Padding' },
  { prop: 'margin', label: 'Margin' },
  { prop: 'border-radius', label: 'Radius' },
];

const DISPLAY_VALUES = ['block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'contents', 'none'];

const PANEL_HTML = `
  <div class="hover-box"></div>
  <div class="hover-label"></div>
  <div class="select-box"></div>
  <div class="panel" part="panel">
    <div class="toast"></div>
    <header data-drag>
      <span class="title">Edit page</span>
      <span class="count" data-ref="count"></span>
      <button class="icon" data-act="minimize" title="Minimize">–</button>
      <button class="icon" data-act="exit" title="Exit edit mode (Esc)">×</button>
    </header>
    <div class="target-row">
      <span class="target empty" data-ref="target">Hover and click an element</span>
      <button data-act="parent" title="Select parent (↑)" disabled>↑</button>
    </div>
    <div class="body" data-ref="body" hidden>
      <div class="actions">
        <button class="danger" data-act="delete" title="Remove element (Delete)">Delete</button>
        <button data-act="hide">Hide</button>
        <button data-act="duplicate">Duplicate</button>
        <button data-act="edit-text">Edit text</button>
      </div>
      <div class="grid">
        ${STYLE_FIELDS.map((f) => `
          <label>${f.label}</label>
          <div class="field">
            ${f.color ? `<input type="color" data-color-for="${f.prop}">` : ''}
            <input type="text" data-prop="${f.prop}" spellcheck="false">
          </div>`).join('')}
        <label>Opacity</label>
        <div class="field"><input type="range" min="0" max="1" step="0.05" data-prop="opacity"></div>
        <label>Display</label>
        <div class="field">
          <select data-prop="display">
            ${DISPLAY_VALUES.map((v) => `<option value="${v}">${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div>
        <div class="section-label"><span>CSS (inline style)</span><button data-act="apply-css">Apply</button></div>
        <textarea data-ref="css" spellcheck="false" placeholder="color: red; gap: 8px;"></textarea>
      </div>
      <div>
        <div class="section-label"><span>Classes</span></div>
        <div class="chips" data-ref="chips"></div>
        <input type="text" data-ref="add-class" placeholder="Add class + Enter" spellcheck="false">
      </div>
      <details data-ref="js-details">
        <summary>Run JS ($0 = element)</summary>
        <textarea data-ref="js" spellcheck="false" placeholder="$0.textContent = 'Hello'"></textarea>
        <div class="section-label"><span></span><button data-act="run-js">Run</button></div>
        <div class="js-out" data-ref="js-out"></div>
      </details>
    </div>
    <footer>
      <button data-act="undo" title="Undo (⌘Z / Ctrl+Z)">Undo</button>
      <button data-act="reset" title="Undo all changes">Reset page</button>
      <span class="spacer"></span>
      <button data-act="copy" title="Copy a summary of all changes">Copy changes</button>
    </footer>
    <div class="hint">Click to select · ↑ parent · ⌘Z undo · Esc exit</div>
  </div>
`;

function rgbToHex(value) {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(value || '');
  if (!m) return '#000000';
  return '#' + [m[1], m[2], m[3]].map((n) => Number(n).toString(16).padStart(2, '0')).join('');
}

function createEditMode() {
  const tracker = new ChangeTracker();
  const state = {
    active: false,
    host: null,
    root: null,
    hovered: null,
    selected: null,
    editingText: null,
    editSnapshot: null,
    pendingStyle: null,
    rafId: 0,
    toastTimer: 0,
  };
  const refs = {};

  // ---------- helpers ----------

  function $(sel) {
    return state.root.querySelector(sel);
  }

  function isOwnEvent(e) {
    return state.host && e.composedPath().includes(state.host);
  }

  function eventElement(e) {
    const path = e.composedPath();
    const first = path.find((n) => n && n.nodeType === 1);
    return first || null;
  }

  function isSelectable(el) {
    return el && el.nodeType === 1 && el !== state.host && el !== document.documentElement;
  }

  function toast(message) {
    const t = $('.toast');
    t.textContent = message;
    t.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => t.classList.remove('show'), 1600);
  }

  function placeBox(box, el) {
    if (!el || !el.isConnected) {
      box.style.display = 'none';
      return null;
    }
    const r = el.getBoundingClientRect();
    box.style.display = 'block';
    box.style.left = r.left + 'px';
    box.style.top = r.top + 'px';
    box.style.width = r.width + 'px';
    box.style.height = r.height + 'px';
    return r;
  }

  function tick() {
    if (!state.active) return;
    const selRect = placeBox(refs.selectBox, state.selected);
    const hoverTarget = state.hovered && state.hovered !== state.selected ? state.hovered : null;
    const hoverRect = placeBox(refs.hoverBox, hoverTarget);
    const label = refs.hoverLabel;
    const labelEl = hoverTarget || state.selected;
    const lr = hoverTarget ? hoverRect : selRect;
    if (labelEl && lr) {
      label.style.display = 'block';
      label.innerHTML = '';
      label.append(describe(labelEl));
      const size = document.createElement('span');
      size.className = 'size';
      size.textContent = `${Math.round(lr.width)}×${Math.round(lr.height)}`;
      label.append(size);
      const top = lr.top > 22 ? lr.top - 21 : Math.min(lr.bottom + 3, window.innerHeight - 20);
      label.style.top = top + 'px';
      label.style.left = Math.max(0, Math.min(lr.left, window.innerWidth - 200)) + 'px';
    } else {
      label.style.display = 'none';
    }
    state.rafId = requestAnimationFrame(tick);
  }

  // ---------- change primitives ----------

  function commitStyle(el, prevStyle, label) {
    const now = el.getAttribute('style');
    if (now === prevStyle) return;
    tracker.push({
      kind: 'style',
      label,
      undo: () => setAttr(el, 'style', prevStyle),
      el,
    });
    afterChange();
  }

  function setStyle(el, prop, value, label) {
    tracker.track(el);
    const prev = el.getAttribute('style');
    if (value === '' || value === null) el.style.removeProperty(prop);
    else el.style.setProperty(prop, value);
    commitStyle(el, prev, label || prop);
  }

  function afterChange() {
    refs.count.textContent = tracker.size ? `${tracker.size} change${tracker.size === 1 ? '' : 's'}` : '';
    refreshPanel();
  }

  // ---------- selection ----------

  function select(el) {
    if (state.editingText && state.editingText !== el) stopTextEdit();
    state.selected = isSelectable(el) ? el : null;
    refreshPanel();
  }

  function refreshPanel() {
    if (!state.root) return;
    const el = state.selected && state.selected.isConnected ? state.selected : null;
    if (!el) state.selected = null;

    refs.body.hidden = !el;
    refs.target.textContent = el ? getSelector(el) : 'Hover and click an element';
    refs.target.classList.toggle('empty', !el);
    $('[data-act="parent"]').disabled = !el || !el.parentElement || el.parentElement === document.documentElement;
    $('[data-act="undo"]').disabled = !tracker.size;
    $('[data-act="reset"]').disabled = !tracker.size;
    refs.selectBox.classList.toggle('editing', !!state.editingText);
    if (!el) return;

    const active = state.root.activeElement;
    const computed = getComputedStyle(el);

    state.root.querySelectorAll('[data-prop]').forEach((input) => {
      if (input === active) return;
      input.value = computed.getPropertyValue(input.dataset.prop);
    });
    state.root.querySelectorAll('[data-color-for]').forEach((input) => {
      if (input === active) return;
      input.value = rgbToHex(computed.getPropertyValue(input.dataset.colorFor));
    });
    if (refs.css !== active) refs.css.value = (el.getAttribute('style') || '').replace(/;\s*/g, ';\n').trim();

    const hideBtn = $('[data-act="hide"]');
    hideBtn.textContent = el.style.display === 'none' ? 'Show' : 'Hide';
    const editBtn = $('[data-act="edit-text"]');
    editBtn.classList.toggle('active', state.editingText === el);
    editBtn.textContent = state.editingText === el ? 'Done editing' : 'Edit text';

    refs.chips.innerHTML = '';
    Array.from(el.classList).filter((c) => !c.startsWith('plotta-')).forEach((cls) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.append(cls);
      const x = document.createElement('button');
      x.textContent = '×';
      x.title = `Remove .${cls}`;
      x.addEventListener('click', () => changeClass(el, cls, false));
      chip.append(x);
      refs.chips.append(chip);
    });
  }

  // ---------- actions ----------

  function changeClass(el, cls, add) {
    tracker.track(el);
    const prev = el.getAttribute('class');
    el.classList.toggle(cls, add);
    if (el.getAttribute('class') === prev) return;
    tracker.push({ kind: 'class', label: (add ? 'add ' : 'remove ') + cls, undo: () => setAttr(el, 'class', prev) });
    afterChange();
  }

  function removeSelected() {
    const el = state.selected;
    if (!el) return;
    stopTextEdit();
    const parent = el.parentNode;
    const next = el.nextSibling;
    const selector = getSelector(el);
    el.remove();
    tracker.push({
      kind: 'remove',
      label: 'delete',
      selector,
      undo: () => parent.insertBefore(el, next && next.parentNode === parent ? next : null),
    });
    state.selected = null;
    state.hovered = null;
    afterChange();
    toast('Deleted');
  }

  function toggleHide() {
    const el = state.selected;
    if (!el) return;
    setStyle(el, 'display', el.style.display === 'none' ? '' : 'none', 'hide');
  }

  function duplicateSelected() {
    const el = state.selected;
    if (!el || !el.parentNode) return;
    stopTextEdit();
    const selector = getSelector(el);
    const clone = el.cloneNode(true);
    el.after(clone);
    tracker.push({
      kind: 'duplicate',
      label: 'duplicate',
      selector,
      undo: () => {
        clone.remove();
        if (state.selected === clone) state.selected = el;
      },
    });
    state.selected = clone;
    afterChange();
    toast('Duplicated');
  }

  function startTextEdit(el) {
    tracker.track(el);
    state.editingText = el;
    state.editSnapshot = { html: el.innerHTML, attr: el.getAttribute('contenteditable') };
    el.setAttribute('contenteditable', 'true');
    el.focus({ preventScroll: true });
    refreshPanel();
  }

  function stopTextEdit() {
    const el = state.editingText;
    if (!el) return;
    const snap = state.editSnapshot;
    setAttr(el, 'contenteditable', snap.attr);
    state.editingText = null;
    state.editSnapshot = null;
    if (el.innerHTML !== snap.html) {
      tracker.push({ kind: 'text', label: 'edit text', undo: () => { el.innerHTML = snap.html; } });
      afterChange();
    } else {
      refreshPanel();
    }
  }

  function applyCssText() {
    const el = state.selected;
    if (!el) return;
    tracker.track(el);
    const prev = el.getAttribute('style');
    const value = refs.css.value.replace(/\n/g, ' ').trim();
    if (value) el.setAttribute('style', value);
    else el.removeAttribute('style');
    commitStyle(el, prev, 'css');
    refs.css.blur();
    refreshPanel();
  }

  function selectParent() {
    const el = state.selected;
    if (el && el.parentElement && el.parentElement !== document.documentElement) select(el.parentElement);
  }

  function undo() {
    if (state.editingText) stopTextEdit();
    const entry = tracker.undo();
    if (entry) toast('Undo ' + entry.label);
    else toast('Nothing to undo');
    afterChange();
  }

  function resetAll() {
    if (state.editingText) stopTextEdit();
    const count = tracker.reset();
    afterChange();
    toast(count ? `Reverted ${count} change${count === 1 ? '' : 's'}` : 'Nothing to reset');
  }

  function copyText(text) {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('style', 'position:fixed;top:-1000px;opacity:0');
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
    };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
    return fallback();
  }

  function copyChanges() {
    if (state.editingText) stopTextEdit();
    const summary = tracker.summary();
    if (!summary) {
      toast('No changes yet');
      return;
    }
    copyText(summary)
      .then(() => toast('Changes copied'))
      .catch(() => {
        console.log(summary);
        toast('Copy blocked – summary logged to console');
      });
  }

  function runJs() {
    const el = state.selected;
    const code = refs.js.value.trim();
    const out = refs.jsOut;
    if (!el || !code) return;
    if (!(window.chrome && chrome.runtime && chrome.runtime.sendMessage)) {
      out.textContent = 'Run JS needs the extension runtime.';
      out.classList.add('error');
      return;
    }
    tracker.track(el);
    const before = {
      html: el.innerHTML,
      attrs: Array.from(el.attributes).map((a) => [a.name, a.value]),
    };
    const selector = getSelector(el);
    el.setAttribute(TARGET_ATTR, '');
    out.textContent = 'Running…';
    out.classList.remove('error');
    chrome.runtime.sendMessage({ action: 'plottaEditRunJs', code }, (response) => {
      el.removeAttribute(TARGET_ATTR);
      const err = chrome.runtime.lastError ? chrome.runtime.lastError.message : response && response.error;
      if (err) {
        out.textContent = err;
        out.classList.add('error');
        return;
      }
      out.textContent = response && response.result !== undefined ? '→ ' + response.result : '✓ done';
      tracker.push({
        kind: 'js',
        label: 'run JS',
        selector,
        code,
        undo: () => {
          // Best effort: restores the element's own attributes and content.
          Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
          before.attrs.forEach(([name, value]) => el.setAttribute(name, value));
          if (el.innerHTML !== before.html) el.innerHTML = before.html;
        },
      });
      afterChange();
    });
  }

  // ---------- page event handlers (capture phase) ----------

  function onMove(e) {
    if (isOwnEvent(e)) {
      state.hovered = null;
      return;
    }
    const el = eventElement(e);
    state.hovered = isSelectable(el) ? el : null;
  }

  function onPointer(e) {
    if (isOwnEvent(e)) return;
    if (state.editingText && e.composedPath().includes(state.editingText)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === 'click') {
      if (state.editingText) stopTextEdit();
      select(eventElement(e));
    }
  }

  function onKey(e) {
    if (isOwnEvent(e)) {
      const field = state.root.activeElement;
      const typing = field && /^(INPUT|TEXTAREA|SELECT)$/.test(field.tagName);
      if (typing) {
        // Let fields handle their own keys (incl. native undo); Esc just leaves the field.
        if (e.key === 'Escape') {
          field.blur();
          e.stopImmediatePropagation();
        }
        return;
      }
    }

    if (state.editingText) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        stopTextEdit();
      }
      return; // let the user type/undo natively inside contentEditable
    }

    const mod = e.metaKey || e.ctrlKey;
    let handled = true;
    if (e.key === 'Escape') deactivate();
    else if (e.key === 'ArrowUp' && state.selected) selectParent();
    else if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') undo();
    else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selected) removeSelected();
    else handled = false;

    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  const pointerEvents = ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'dblclick', 'auxclick'];

  // ---------- UI wiring ----------

  function buildUi() {
    const host = document.createElement(HOST_TAG);
    host.setAttribute('style', 'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;');
    const root = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = PANEL_CSS;
    root.append(style);
    const wrap = document.createElement('div');
    wrap.innerHTML = PANEL_HTML;
    root.append(...wrap.childNodes);

    // Keep keystrokes typed in the panel away from page shortcuts.
    ['keydown', 'keyup', 'keypress'].forEach((type) => host.addEventListener(type, (e) => e.stopPropagation()));

    state.host = host;
    state.root = root;
    refs.hoverBox = $('.hover-box');
    refs.hoverLabel = $('.hover-label');
    refs.selectBox = $('.select-box');
    refs.panel = $('.panel');
    refs.body = $('[data-ref="body"]');
    refs.target = $('[data-ref="target"]');
    refs.count = $('[data-ref="count"]');
    refs.css = $('[data-ref="css"]');
    refs.chips = $('[data-ref="chips"]');
    refs.addClass = $('[data-ref="add-class"]');
    refs.js = $('[data-ref="js"]');
    refs.jsOut = $('[data-ref="js-out"]');

    const actions = {
      exit: deactivate,
      minimize: () => refs.panel.classList.toggle('minimized'),
      parent: selectParent,
      delete: removeSelected,
      hide: toggleHide,
      duplicate: duplicateSelected,
      'edit-text': () => {
        if (state.editingText) stopTextEdit();
        else if (state.selected) startTextEdit(state.selected);
      },
      'apply-css': applyCssText,
      'run-js': runJs,
      undo,
      reset: resetAll,
      copy: copyChanges,
    };
    root.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-act]');
      if (btn && actions[btn.dataset.act]) actions[btn.dataset.act]();
    });
    // Keep focus in the text being edited when pressing panel buttons.
    root.addEventListener('mousedown', (e) => {
      if (state.editingText && e.target.closest('button')) e.preventDefault();
    });

    // Quick CSS controls: live preview on input, one undo step per change.
    root.addEventListener('focusin', (e) => {
      const t = e.target;
      if (state.selected && (t.dataset.prop || t.dataset.colorFor)) {
        tracker.track(state.selected);
        state.pendingStyle = { el: state.selected, style: state.selected.getAttribute('style') };
      }
    });
    root.addEventListener('input', (e) => {
      const t = e.target;
      const prop = t.dataset.prop || t.dataset.colorFor;
      const el = state.selected;
      if (!prop || !el) return;
      if (!state.pendingStyle || state.pendingStyle.el !== el) {
        tracker.track(el);
        state.pendingStyle = { el, style: el.getAttribute('style') };
      }
      el.style.setProperty(prop, t.value);
      if (t.dataset.colorFor) {
        const text = $(`[data-prop="${prop}"]`);
        if (text) text.value = t.value;
      }
    });
    root.addEventListener('change', (e) => {
      const t = e.target;
      const prop = t.dataset.prop || t.dataset.colorFor;
      const pending = state.pendingStyle;
      if (!prop || !pending) return;
      if (t.value === '') pending.el.style.removeProperty(prop);
      state.pendingStyle = null;
      commitStyle(pending.el, pending.style, prop);
    });
    root.addEventListener('keydown', (e) => {
      const t = e.target;
      if (t.dataset.prop && e.key === 'Enter') t.blur();
      if (t === refs.css && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) applyCssText();
      if (t === refs.js && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) runJs();
      if (t === refs.addClass && e.key === 'Enter') {
        const names = t.value.trim().split(/\s+/).filter(Boolean);
        names.forEach((n) => state.selected && changeClass(state.selected, n.replace(/^\./, ''), true));
        t.value = '';
      }
    });

    // Drag the panel by its header.
    const header = $('[data-drag]');
    header.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      const rect = refs.panel.getBoundingClientRect();
      const dx = e.clientX - rect.left;
      const dy = e.clientY - rect.top;
      header.setPointerCapture(e.pointerId);
      const move = (ev) => {
        refs.panel.style.left = Math.max(0, Math.min(ev.clientX - dx, window.innerWidth - rect.width)) + 'px';
        refs.panel.style.top = Math.max(0, Math.min(ev.clientY - dy, window.innerHeight - 40)) + 'px';
        refs.panel.style.right = 'auto';
        refs.panel.style.bottom = 'auto';
      };
      const up = () => {
        header.removeEventListener('pointermove', move);
        header.removeEventListener('pointerup', up);
      };
      header.addEventListener('pointermove', move);
      header.addEventListener('pointerup', up);
    });
  }

  // ---------- lifecycle ----------

  function activate() {
    if (state.active) return;
    state.active = true;
    buildUi();
    document.documentElement.append(state.host);

    if (!document.getElementById(PAGE_STYLE_ID)) {
      const pageStyle = document.createElement('style');
      pageStyle.id = PAGE_STYLE_ID;
      pageStyle.textContent = PAGE_CSS;
      (document.head || document.documentElement).append(pageStyle);
    }
    document.documentElement.classList.add(ACTIVE_CLASS);

    window.addEventListener('mousemove', onMove, true);
    pointerEvents.forEach((t) => window.addEventListener(t, onPointer, true));
    window.addEventListener('keydown', onKey, true);
    afterChange();
    state.rafId = requestAnimationFrame(tick);
  }

  function deactivate() {
    if (!state.active) return;
    stopTextEdit();
    state.active = false;
    cancelAnimationFrame(state.rafId);
    window.removeEventListener('mousemove', onMove, true);
    pointerEvents.forEach((t) => window.removeEventListener(t, onPointer, true));
    window.removeEventListener('keydown', onKey, true);
    document.documentElement.classList.remove(ACTIVE_CLASS);
    const pageStyle = document.getElementById(PAGE_STYLE_ID);
    if (pageStyle) pageStyle.remove();
    if (state.host) state.host.remove();
    state.host = null;
    state.root = null;
    state.hovered = null;
    state.selected = null;
  }

  return {
    get active() { return state.active; },
    activate,
    deactivate,
    toggle() {
      if (state.active) deactivate();
      else activate();
    },
    // exposed for tests / debugging
    tracker,
  };
}

if (window.__plottaEditMode) {
  window.__plottaEditMode.toggle();
} else {
  window.__plottaEditMode = createEditMode();
  window.__plottaEditMode.activate();
}
