import './style.css';
import { $ } from './utils';
import * as F from './utils';
import * as bx from './types';

const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime) as bx.SendMessage;

(async () => {
  const html = await F.cbToPromise(F.curry(sendMessage)({ type: bx.MessageTypes.clRequestHtml }));

  if (document.readyState !== 'complete') {
    await F.cbToPromise(F.swap(F.curry(F.curry(document.addEventListener))('DOMContentLoaded'))(false));
  }
  const $leafs = $<HTMLDivElement>('.leafs');
  $leafs.innerHTML = html;

  chrome.runtime.onMessage.addListener((msg: bx.Message) => {
    switch (msg.type) {
      case bx.MessageTypes.svrSendHtml:
        $leafs.innerHTML = msg.html || '';
        break;
      default:
        break;
    }
  });
})();
