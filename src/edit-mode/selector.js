// Selector helpers for edit mode.
// Generates reasonably stable CSS selectors: unique #id first, otherwise a
// short tag + classes path, falling back to :nth-of-type where needed.

const MAX_CLASSES = 3;

function esc(value) {
  return window.CSS && CSS.escape ? CSS.escape(value) : value.replace(/([^\w-])/g, '\\$1');
}

function isUnique(selector, el) {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === el;
  } catch (e) {
    return false;
  }
}

function usableClasses(el) {
  return Array.from(el.classList)
    .filter((c) => c && !c.startsWith('plotta-'))
    .slice(0, MAX_CLASSES);
}

function basePart(el) {
  const tag = el.tagName.toLowerCase();
  return tag + usableClasses(el).map((c) => '.' + esc(c)).join('');
}

function nthOfType(el) {
  let index = 1;
  let hasSameTagSibling = false;
  let sib = el.previousElementSibling;
  while (sib) {
    if (sib.tagName === el.tagName) {
      index++;
      hasSameTagSibling = true;
    }
    sib = sib.previousElementSibling;
  }
  sib = el.nextElementSibling;
  while (!hasSameTagSibling && sib) {
    if (sib.tagName === el.tagName) hasSameTagSibling = true;
    sib = sib.nextElementSibling;
  }
  return hasSameTagSibling ? `:nth-of-type(${index})` : '';
}

function uniqueId(el) {
  if (!el.id) return null;
  const sel = '#' + esc(el.id);
  return isUnique(sel, el) ? sel : null;
}

export function getSelector(el) {
  if (!el || el.nodeType !== 1) return '';
  if (el === document.documentElement) return 'html';
  if (el === document.body) return 'body';

  const own = uniqueId(el);
  if (own) return own;

  const parts = [];
  let cur = el;

  while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
    if (cur !== el) {
      const id = uniqueId(cur);
      if (id) {
        parts.unshift(id);
        break;
      }
    }

    const base = basePart(cur);
    const plain = [base, ...parts].join(' > ');
    if (cur.isConnected && isUnique(plain, el)) return plain;

    const withNth = base + nthOfType(cur);
    const nthPath = [withNth, ...parts].join(' > ');
    if (cur.isConnected && isUnique(nthPath, el)) return nthPath;

    parts.unshift(withNth);
    if (cur === document.body) break;
    cur = cur.parentElement;
  }

  return parts.join(' > ');
}

// Short human label: tag#id.class1.class2
export function describe(el) {
  if (!el || el.nodeType !== 1) return '';
  let label = el.tagName.toLowerCase();
  if (el.id) label += '#' + el.id;
  const classes = usableClasses(el).slice(0, 2);
  if (classes.length) label += '.' + classes.join('.');
  return label;
}
