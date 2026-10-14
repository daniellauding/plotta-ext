// Change tracking for edit mode: undo stack + readable summary.
import { getSelector } from './selector.js';

function parseStyle(styleAttr) {
  const tmp = document.createElement('div');
  if (styleAttr) tmp.setAttribute('style', styleAttr);
  const map = new Map();
  for (let i = 0; i < tmp.style.length; i++) {
    const prop = tmp.style[i];
    const priority = tmp.style.getPropertyPriority(prop);
    map.set(prop, tmp.style.getPropertyValue(prop) + (priority ? ' !' + priority : ''));
  }
  return map;
}

function classSet(value) {
  return new Set((value || '').split(/\s+/).filter((c) => c && !c.startsWith('plotta-')));
}

function shorten(text, max = 120) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}

export function setAttr(el, name, value) {
  if (value === null || value === undefined) el.removeAttribute(name);
  else el.setAttribute(name, value);
}

export class ChangeTracker {
  constructor() {
    this.undoStack = [];
    // element -> original state, captured the first time we touch it
    this.originals = new Map();
  }

  get size() {
    return this.undoStack.length;
  }

  track(el) {
    if (this.originals.has(el)) return;
    this.originals.set(el, {
      selector: getSelector(el),
      style: el.getAttribute('style'),
      className: el.getAttribute('class'),
      html: el.innerHTML,
      text: el.textContent,
    });
  }

  // entry: { kind, label, undo(), ...meta }
  push(entry) {
    this.undoStack.push(entry);
  }

  undo() {
    const entry = this.undoStack.pop();
    if (!entry) return null;
    entry.undo();
    return entry;
  }

  reset() {
    let count = 0;
    while (this.undoStack.length) {
      this.undo();
      count++;
    }
    return count;
  }

  summary() {
    const removed = [];
    const duplicated = [];
    const scripts = [];
    for (const entry of this.undoStack) {
      if (entry.kind === 'remove') removed.push(entry.selector);
      if (entry.kind === 'duplicate') duplicated.push(entry.selector);
      if (entry.kind === 'js') scripts.push(entry);
    }

    const cssBlocks = [];
    const hidden = [];
    const classes = [];
    const texts = [];

    for (const [el, orig] of this.originals) {
      if (!el.isConnected) continue;
      // Selector as captured before the first edit, so it matches the original markup.
      const selector = orig.selector || getSelector(el);

      const before = parseStyle(orig.style);
      const after = parseStyle(el.getAttribute('style'));
      const decls = [];
      for (const [prop, value] of after) {
        if (before.get(prop) !== value) decls.push(`  ${prop}: ${value};`);
      }
      for (const prop of before.keys()) {
        if (!after.has(prop)) decls.push(`  /* removed inline: ${prop}: ${before.get(prop)} */`);
      }
      if (decls.length) cssBlocks.push(`${selector} {\n${decls.join('\n')}\n}`);
      if (after.get('display') === 'none' && before.get('display') !== 'none') hidden.push(selector);

      const beforeCls = classSet(orig.className);
      const afterCls = classSet(el.getAttribute('class'));
      const added = [...afterCls].filter((c) => !beforeCls.has(c));
      const removedCls = [...beforeCls].filter((c) => !afterCls.has(c));
      if (added.length || removedCls.length) {
        const diff = [...added.map((c) => '+' + c), ...removedCls.map((c) => '-' + c)].join(' ');
        classes.push(`- ${selector}: ${diff}`);
      }

      if (el.innerHTML !== orig.html) {
        if (el.textContent !== orig.text) {
          texts.push(`- ${selector}:\n    before: "${shorten(orig.text)}"\n    after:  "${shorten(el.textContent)}"`);
        } else {
          texts.push(`- ${selector}: inner HTML changed (text unchanged)`);
        }
      }
    }

    const sections = [];
    if (cssBlocks.length) sections.push('CSS (inline styles)\n```css\n' + cssBlocks.join('\n\n') + '\n```');
    if (removed.length) sections.push('Removed elements\n' + removed.map((s) => '- ' + s).join('\n'));
    if (hidden.length) sections.push('Hidden elements (display: none)\n' + hidden.map((s) => '- ' + s).join('\n'));
    if (texts.length) sections.push('Text edits\n' + texts.join('\n'));
    if (classes.length) sections.push('Class changes\n' + classes.join('\n'));
    if (duplicated.length) sections.push('Duplicated elements\n' + duplicated.map((s) => '- ' + s).join('\n'));
    if (scripts.length) {
      sections.push('JS run ($0 = element)\n' + scripts
        .map((s) => `- ${s.selector}:\n\`\`\`js\n${s.code}\n\`\`\``)
        .join('\n'));
    }

    if (!sections.length) return '';
    const header = `Page edits — ${location.href}\n${new Date().toLocaleString()}`;
    return [header, ...sections].join('\n\n') + '\n';
  }
}
