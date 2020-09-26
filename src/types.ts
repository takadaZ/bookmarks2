export const initialOptions = {
  postPage: false,
  mainWidth: 500,
  mainHeight: 500,
  foldersWidth: 200,
  bodyBackgroundColor: '#f6f6f6',
  leafsBackgroundColor: '#ffffff',
};

export type IOptions = typeof initialOptions;

export interface IHtml {
  leafs: string;
  folders: string;
}

export const MessageTypes = {
  clRequestInitial: 'cl-request-initial',
  clRequestHtml: 'cl-request-html',
  // svrSendHtml: 'svr-send-html',
  clRequestOptions: 'cl-request-options',
  // svrSendOptions: 'svr-send-options',
} as const;

export type Message = {
  type: typeof MessageTypes [keyof typeof MessageTypes];
  html?: IHtml;
  options?: IOptions;
}

// eslint-disable-next-line no-unused-vars
export type SendMessage = (messgae: Message, resp?: (a: any) => any) => void;
