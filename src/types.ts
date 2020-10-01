import { mapStateToResponse } from './background';

export const initialOptions = {
  postPage: false,
  mainWidth: 500,
  mainHeight: 500,
  foldersWidth: 200,
  bodyBackgroundColor: '#f6f6f6',
  leafsBackgroundColor: '#ffffff',
};

export type IOptions = typeof initialOptions;

export interface IClientState {
  open?: number;
  paths?: Array<number>;
}

export interface IHtml {
  leafs: string;
  folders: string;
}

export const CliMessageTypes = {
  requestInitial: 'cl-request-initial',
  // requestHtml: 'cl-request-html',
  // svrSendHtml: 'svr-send-html',
  // requestOptions: 'cl-request-options',
  // svrSendOptions: 'svr-send-options',
  requestSaveState: 'cl-request-save-state',
} as const;

export type CliMessage = {
  type: typeof CliMessageTypes[keyof typeof CliMessageTypes];
  html?: IHtml;
  options?: IOptions;
  clState?: IClientState;
}

export type CliMessages = {
  [CliMessageTypes.requestInitial]: {},
  [CliMessageTypes.requestSaveState]: { clState: IClientState },
}

// eslint-disable-next-line no-unused-vars
export type CliPostMessage<T extends CliMessage> = ReturnType<typeof mapStateToResponse[T['type']]>;

export type CliSendMessage = <T extends CliMessage>(
  // eslint-disable-next-line no-unused-vars
  messgae: T,
  // eslint-disable-next-line no-unused-vars
  response?: (resp: CliPostMessage<T>) => void
) => void;
