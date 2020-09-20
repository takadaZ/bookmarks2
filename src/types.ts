export const MessageTypes = {
  svrSendHtml: 'svr-send-html',
  clRequestHtml: 'cl-request-html',
} as const;

export type Message = {
  type: typeof MessageTypes [keyof typeof MessageTypes];
  html?: string;
}

// eslint-disable-next-line no-unused-vars
export type SendMessage = (messgae: Message, resp?: (a: any) => any) => void;
