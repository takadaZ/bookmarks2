import './style.css';
import { $, $$ } from './utils';
import * as F from './utils';
import * as bx from './types';

const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime) as
  // eslint-disable-next-line no-unused-vars
  (message: any, responseCallback: (response: any) => void) => void;

async function postMessage<T extends keyof bx.MapStateToResponse>(
  msg: { type: T } & Partial<bx.PayloadAction<bx.MessageStateMapObject<bx.MapStateToResponse>[T]>>,
): Promise<ReturnType<bx.MapStateToResponse[T]>> {
  return F.cbToPromise(F.curry(sendMessage)(msg));
}

function setClientState(clState: bx.IClientState) {
  clState.paths?.forEach((id) => $(`.folders [id="${id}"]`).classList.add('path'));
  if (clState.open) {
    $$(`[id="${clState.open}"]`).forEach((el) => el.classList.add('open'));
  }
}

function repaleceHtml(html: bx.IHtml) {
  $('.leafs').innerHTML = html.leafs;
  $('.folders').innerHTML = html.folders;
}

function assignStyle(selector: string, style: Partial<CSSStyleDeclaration>) {
  Object.assign($(selector).style, style);
}

function setOptions(options: bx.IOptions) {
  assignStyle('body', {
    width: `${options.width}px`,
    height: `${options.height}px`,
    backgroundColor: options.bodyBackgroundColor,
  });
  assignStyle('main', {
    gridTemplateColumns: `min-content 1fr min-content ${options.rightWidth}px`,
  });
  assignStyle('.leafs', {
    backgroundColor: options.leafsBackgroundColor,
  });
}

function init() {
  $('.query').focus();
}

(async () => {
  const { options, html, clState } = await postMessage({ type: bx.CliMessageTypes.requestInitial });

  if (document.readyState === 'loading') {
    await F.cbToPromise(F.swap(F.curry(F.curry(document.addEventListener))('DOMContentLoaded'))(false));
  }
  setOptions(options);
  repaleceHtml(html);
  setClientState(clState);
  // eslint-disable-next-line no-use-before-define
  setEventListners();
  init();
})();

function onClickAnchor(e: MouseEvent) {
  const { backgroundImage } = (e.target as HTMLAnchorElement).style;
  const [, url] = /url\("chrome:\/\/favicon\/([\s\S]*)"\)/.exec(backgroundImage) || [];
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.tabs.create({
      index: tab.index + 1,
      windowId: tab.windowId,
      url,
    });
  });
}

function onClickAngle(e: MouseEvent) {
  const target = e.target as HTMLAnchorElement;
  const folder = target.parentElement?.parentElement!;
  if ($('.open', folder)) {
    (target.nextElementSibling as HTMLDivElement)?.click();
  }
  folder.classList.toggle('path');
}

function sendStateOpenedPath(foldersFolder: HTMLElement) {
  $$('.path').forEach((el) => el.classList.remove('path'));
  let paths: Array<number> = [];
  let folder = foldersFolder;
  while (folder.classList.contains('folder')) {
    folder.classList.add('path');
    paths = [...paths, Number(folder.id)];
    folder = folder.parentElement!;
  }
  // Send client state
  postMessage({
    type: bx.CliMessageTypes.requestSaveState,
    payload: {
      paths,
      open: Number(foldersFolder.id),
    },
  });
}

function clearQuery() {
  const $query = $<HTMLInputElement>('.query');
  $query.value = '';
  $query.setAttribute('value', '');
  $query.focus();
  $('.form-query [type="submit"]').click();
}

// eslint-disable-next-line no-unused-vars
function setMouseEventListener(mouseMoveHandler: (e: MouseEvent) => any) {
  const mouseMoveHandlerWrapper = (e: MouseEvent) => {
    e.preventDefault();
    mouseMoveHandler(e);
  };
  document.addEventListener('mousemove', mouseMoveHandlerWrapper, false);
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', mouseMoveHandlerWrapper);
    postMessage({
      type: bx.CliMessageTypes.requestSaveOptions,
      payload: {
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
        rightWidth: $('main > :last-child').offsetWidth,
      },
    });
  }, { once: true });
}

function resizeSplitHandler() {
  const target = $('main');
  return (e: MouseEvent) => {
    const width = Number(document.body.dataset.rightPane) - e.x;
    target.style.gridTemplateColumns = `min-content 1fr min-content ${width}px`;
  };
}

function resizeWidthHandler(e: MouseEvent) {
  const width = Number(document.body.dataset.startX) - e.screenX;
  document.body.style.width = `${width}px`;
}

function resizeHeightHandler(e: MouseEvent) {
  const height = Number(document.body.dataset.startY) + e.screenY;
  document.body.style.height = `${height}px`;
}

function setEventListners() {
  $('.folders').addEventListener('click', (e) => {
    const target = e.target as HTMLDivElement;
    if (target.classList.contains('title')) {
      clearQuery();
      const foldersFolder = target.parentElement?.parentElement!;
      const folders = [foldersFolder, $(`.leafs [id="${foldersFolder.id}"]`)];
      const isOpen = foldersFolder.classList.contains('open');
      if (isOpen) {
        folders.forEach((el) => el.classList.add('path'));
        return false;
      }
      $$('.open').forEach((el) => el.classList.remove('open'));
      folders.forEach((el) => el.classList.add('open'));
      sendStateOpenedPath(foldersFolder);
    } else if (target.localName === 'a') {
      onClickAnchor(e);
    } else if (target.classList.contains('fa-angle-right')) {
      onClickAngle(e);
    } else if (target.classList.contains('folder')) {
      $$('.open').forEach((el) => el.classList.remove('open'));
    }
    return false;
  });
  $('.leafs').addEventListener('click', (e) => {
    const target = e.target as HTMLDivElement;
    if (target.localName === 'a') {
      onClickAnchor(e);
    } else if ([...target.classList].find((className) => ['title', 'fa-angle-right'].includes(className))) {
      const folder = target.parentElement?.parentElement!;
      folder.classList.toggle('path');
    }
  });
  $('.form-query').addEventListener('submit', (e) => {
    e.preventDefault();
    const target = $<HTMLInputElement>('.query');
    const value = target.value.trim();
    target.setAttribute('value', value);
    const re = new RegExp(value, 'i');
    $('.leafs .open')?.classList.remove('open');
    $$('.leafs .search-path').forEach((el) => el.classList.remove('search-path'));
    $$('.leafs .path').forEach((el) => el.classList.remove('path'));
    if (value === '') {
      const openFolder = $('.folders .open');
      if (openFolder) {
        openFolder.classList.remove('open');
        $(':scope > .marker > .title', openFolder)?.click();
      }
      return false;
    }
    $$('.leafs .leaf')
      .filter((leaf) => re.test(leaf.firstElementChild?.textContent!))
      .map((el) => {
        el.classList.add('search-path');
        return el;
      })
      .forEach((el) => {
        let folder = el.parentElement;
        while (folder?.classList.contains('folder')) {
          folder.classList.add('search-path', 'path');
          folder = folder.parentElement;
        }
      });
    return false;
  });
  $('.query').addEventListener('input', () => $('.form-query [type="submit"]').click());
  $('.form-query .fa-times').addEventListener('click', clearQuery);
  $('.split-h').addEventListener('mousedown', (e) => {
    document.body.dataset.rightPane = String($('main > :last-child').offsetWidth + e.x);
    setMouseEventListener(resizeSplitHandler());
  });
  $('.resize-x').addEventListener('mousedown', (e) => {
    document.body.dataset.startX = String($('body').offsetWidth + e.screenX);
    setMouseEventListener(resizeWidthHandler);
  });
  $('.resize-y').addEventListener('mousedown', (e) => {
    document.body.dataset.startY = String($('body').offsetHeight - e.screenY);
    setMouseEventListener(resizeHeightHandler);
  });
  F.setEvents($$('.main-menu'), {
    click: (e) => {
      // eslint-disable-next-line no-alert
      alert((e.target as HTMLElement).className);
    },
    mousedown: (e) => e.preventDefault(),
  });
}
