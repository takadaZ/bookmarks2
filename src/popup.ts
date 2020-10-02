import './style.css';
import { $, $$ } from './utils';
import * as F from './utils';
import * as bx from './types';

const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime) as bx.CliSendMessage;

function postMessage<T extends bx.CliMessage>(message: T): Promise<bx.CliPostMessage<T>> {
  return F.cbToPromise(F.curry(sendMessage)(message));
}

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
  const folder = (e.target as HTMLAnchorElement).parentElement?.parentElement!;
  if ($('.open', folder)) {
    ((e.target as HTMLAnchorElement).nextElementSibling as HTMLDivElement)?.click();
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
  const type = bx.CliMessageTypes.requestSaveState;
  const open = Number(foldersFolder.id);
  const clState = { open, paths };
  postMessage({ type, clState });
}

function setEventListners() {
  $('.folders').addEventListener('click', (e) => {
    if ((e.target as HTMLDivElement).classList.contains('title')) {
      const foldersFolder = (e.target as HTMLDivElement).parentElement?.parentElement!;
      const folders = [foldersFolder, $(`.leafs [id="${foldersFolder.id}"]`)];
      const isOpen = foldersFolder.classList.contains('open');
      if (isOpen) {
        folders.forEach((el) => el.classList.add('path'));
        return false;
      }
      $$('.open').forEach((el) => el.classList.remove('open'));
      folders.forEach((el) => el.classList.add('open'));
      sendStateOpenedPath(foldersFolder);
    } else if ((e.target as HTMLDivElement).localName === 'a') {
      onClickAnchor(e);
    } else if ((e.target as HTMLDivElement).classList.contains('fa-angle-right')) {
      onClickAngle(e);
    }
    return false;
  });
  $('.leafs').addEventListener('click', (e) => {
    if ((e.target as HTMLDivElement).localName === 'a') {
      onClickAnchor(e);
    }
  });
  $('form').addEventListener('submit', () => {
    const text = $<HTMLInputElement>('.query').value;
    $$('.leafs a').filter((el) => el.textContent?.includes(text));
    return false;
  });
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
    backgroundColor: options.bodyBackgroundColor,
  });
  assignStyle('main', {
    width: `${options.mainWidth}px`,
    height: `${options.mainHeight}px`,
  });
  assignStyle('.leafs', { backgroundColor: options.leafsBackgroundColor });
  assignStyle('.folders', { width: `${options.foldersWidth}px` });
}

function init() {
  $('.query').focus();
}

(async () => {
  const { options, html, clState } = await postMessage({ type: bx.CliMessageTypes.requestInitial });

  if (document.readyState !== 'complete') {
    await F.cbToPromise(F.swap(F.curry(F.curry(document.addEventListener))('DOMContentLoaded'))(false));
  }
  setOptions(options);
  repaleceHtml(html);
  setClientState(clState);
  setEventListners();
  init();

  // chrome.runtime.onMessage.addListener((msg: bx.Message) => {
  //   switch (msg.type) {
  //     // case bx.MessageTypes.svrSendHtml:
  //     //   repaleceHtml(msg.html!);
  //     //   break;
  //     // case bx.MessageTypes.svrSendOptions:
  //     //   setOptions(msg.options!);
  //     //   break;
  //     default:
  //       break;
  //   }
  // });
})();
