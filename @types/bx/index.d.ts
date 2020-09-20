// eslint-disable-next-line no-unused-vars
declare namespace bx {

  const MessageTypes = {
    svrSendHtml: 'svr-send-html',
    clRequestHtml: 'cl-request-html',
  } as const;

  type Message = {
    type: typeof MessageTypes [keyof typeof MessageTypes];
    html?: string;
  }

  // eslint-disable-next-line no-unused-vars
  type SendMessage = (messgae: Message, resp?: (a: any) => any) => void;

}
