import './style.css';
import { $, $$ } from './utils';
import * as F from './utils';
import * as bx from './types';

const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime) as bx.SendMessage;

function postMessage(message: bx.Message) {
  return F.cbToPromise(F.curry(sendMessage)(message));
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

function setEventListners() {
  $('.folders').addEventListener('click', (e) => {
    if ((e.target as HTMLDivElement).classList.contains('title')) {
      const foldersFolder = (e.target as HTMLDivElement).parentElement?.parentElement!;
      const folders = [foldersFolder, $(`.leafs [id="${foldersFolder.id}"]`)];
      const isOpen = foldersFolder.classList.contains('open');
      if (isOpen) {
        folders.forEach((el) => el.classList.remove('open'));
        return;
      }
      $$('.open').forEach((el) => el.classList.remove('open'));
      folders.forEach((el) => el.classList.add('open'));
      $$('.path').forEach((el) => el.classList.remove('path'));
      let folder = foldersFolder.parentElement!;
      while (folder.classList.contains('folder')) {
        folder.classList.add('path');
        folder = folder.parentElement!;
      }
    }
  });
  $('.leafs').addEventListener('click', (e) => {
    if ((e.target as HTMLDivElement).localName === 'a') {
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
  });
}

(async () => {
  const { options, html } = await postMessage({ type: bx.MessageTypes.clRequestInitial });

  if (document.readyState !== 'complete') {
    await F.cbToPromise(F.swap(F.curry(F.curry(document.addEventListener))('DOMContentLoaded'))(false));
  }
  setOptions(options);
  repaleceHtml(html);
  setEventListners();

  chrome.runtime.onMessage.addListener((msg: bx.Message) => {
    switch (msg.type) {
      // case bx.MessageTypes.svrSendHtml:
      //   repaleceHtml(msg.html!);
      //   break;
      // case bx.MessageTypes.svrSendOptions:
      //   setOptions(msg.options!);
      //   break;
      default:
        break;
    }
  });
})();
