// Background wiring for edit mode: keyboard command, context menu and the
// "Run JS" bridge. Kept separate from the sticky-note logic in background.js.

const COMMAND_ID = 'toggle-edit-mode';
const MENU_ID = 'plotta-edit-mode';
const SCRIPT_FILE = 'edit-mode.js';

async function toggleEditMode(tab) {
  let target = tab;
  if (!target || !target.id) {
    [target] = await chrome.tabs.query({ active: true, currentWindow: true });
  }
  if (!target || !target.id) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId: target.id },
      files: [SCRIPT_FILE],
    });
  } catch (error) {
    // chrome:// pages, the Web Store etc. cannot be scripted.
    console.warn('Plotta edit mode: cannot run on this page', error);
  }
}

// Runs in the page's MAIN world (not the isolated content-script world),
// so the snippet sees the page's own globals. Uses `new Function`, which is
// subject to the *page's* CSP: pages without 'unsafe-eval' will refuse it.
function runSnippetInPage(code, targetAttr) {
  const $0 = document.querySelector(`[${targetAttr}]`);
  try {
    const fn = new Function('$0', code);
    const result = fn($0);
    if (result === undefined) return { result: undefined };
    let text;
    if (result instanceof Element) text = result.outerHTML.slice(0, 200);
    else {
      try { text = JSON.stringify(result); } catch (e) { text = String(result); }
    }
    return { result: String(text).slice(0, 500) };
  } catch (error) {
    const blocked = error instanceof EvalError || /unsafe-eval|Content Security Policy/i.test(error.message);
    return {
      error: blocked
        ? "Blocked by this page's Content Security Policy (no 'unsafe-eval')."
        : `${error.name}: ${error.message}`,
    };
  }
}

export function registerEditMode() {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: MENU_ID,
      title: 'Edit page elements',
      contexts: ['page', 'selection', 'link', 'image'],
    });
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === MENU_ID) toggleEditMode(tab);
  });

  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === COMMAND_ID) toggleEditMode(tab);
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'plottaEditToggle') {
      toggleEditMode(request.tabId ? { id: request.tabId } : sender.tab).then(() => sendResponse({ ok: true }));
      return true;
    }

    if (request.action !== 'plottaEditRunJs' || !sender.tab) return false;

    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id, frameIds: [sender.frameId || 0] },
      world: 'MAIN',
      func: runSnippetInPage,
      args: [request.code, 'data-plotta-edit-target'],
    })
      .then(([injection]) => sendResponse(injection ? injection.result : { error: 'No result' }))
      .catch((error) => sendResponse({ error: error.message }));
    return true;
  });
}
