import { mapStateToResponse } from './background';

export const initialOptions = {
  postPage: false,
  width: 500,
  height: 500,
  rightWidth: 200,
  bodyBackgroundColor: '#f6f6f6',
  leafsBackgroundColor: '#ffffff',
};

export type IOptions = Partial<typeof initialOptions>;

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
  requestSaveOptions: 'cl-request-save-options',
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
