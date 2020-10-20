import {
  PayloadAction,
  ReduxHandlers,
} from './redux-provider';

import {
  MapStateToResponse,
} from './background';

export {
  PayloadAction,
} from '@reduxjs/toolkit';

export {
  MapStateToResponse,
} from './background';

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
  initialize: 'cl-initialize',
  saveOptions: 'cl-save-options',
  saveState: 'cl-save-state',
  openBookmark: 'cl-open-bookmark',
  addBookmark: 'cl-add-bookmark',
  removeBookmark: 'cl-remove-bookmark',
} as const;

export type RequestCallback<T> = (
  // eslint-disable-next-line no-unused-vars
  reduxHandlers: ReduxHandlers,
  // eslint-disable-next-line no-unused-vars
  { payload }: PayloadAction<T>
) => any;

export type MessageStateMapObject<M extends MapStateToResponse> = {
  [K in keyof M]: M[K] extends RequestCallback<infer S> ? S : never;
}
