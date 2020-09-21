import './style.css';
import { $ } from './utils';
import * as F from './utils';

const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime) as bx.SendMessage;

function repaleceHtml(html?: string) {
  $('.leafs').innerHTML = html || '';
}

(async () => {
  const html = await F.cbToPromise(F.curry(sendMessage)({ type: bx.MessageTypes.clRequestHtml }));

  if (document.readyState !== 'complete') {
    await F.cbToPromise(F.swap(F.curry(F.curry(document.addEventListener))('DOMContentLoaded'))(false));
  }
  repaleceHtml(html);

  chrome.runtime.onMessage.addListener((msg: bx.Message) => {
    switch (msg.type) {
      case bx.MessageTypes.svrSendHtml:
        repaleceHtml(msg.html);
        break;
      default:
        break;
    }
  });
})();
