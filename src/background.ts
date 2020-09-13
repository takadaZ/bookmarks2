import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch, StateSubscriber, StateListener } from './redux-provider';

function $<T extends HTMLElement>(selector: string, parent: HTMLElement | Document = document) {
  return parent.querySelector(selector) as T;
}

function $$<T extends HTMLElement[]>(selector: string, parent: HTMLElement | Document = document) {
  return [...parent.querySelectorAll(selector)] as T;
}

interface IRequestInfo {
  [tabId: number]: {
    formData?: {
      [key: string]: string[],
    }
  } | null
}

interface IOptions {
  postPage: boolean,
}

const webRequest = createSlice({
  initialState: {} as IRequestInfo,
  name: 'webRequest',
  reducers: {
    request: (state: IRequestInfo, { payload }: PayloadAction<chrome.webRequest.WebRequestBodyDetails>) => {
      return { ...state, [payload.tabId]: { formData: payload.requestBody.formData } };
    },
    removePostData: (state: IRequestInfo, { payload }: PayloadAction<number>) => {
      return { ...state, [payload]: null };
    },
    removePostDataAll: () => ({})
  }
});

const sliceOptions = createSlice({
  initialState: {} as IOptions,
  name: 'options',
  reducers: {
    save: (state: IOptions, { payload }: PayloadAction<IOptions>) => {
      return { ...state, ...payload };
    }
  }
});

export const slices = {
  webRequest,
  options: sliceOptions,
};

function onBeforeRequestHandler(state: State, dispatch: Dispatch, details: chrome.webRequest.WebRequestBodyDetails) {
  if (details && details.frameId === 0 && details.type === 'main_frame' && details.method === 'POST' && details.requestBody) {
    dispatch(webRequest.actions.request(details));
  }
}

function onRemovedTabsHandler(state: State, dispatch: Dispatch, tabId: number) {
  dispatch(webRequest.actions.removePostData(tabId));
}

type A = typeof onRemovedTabsHandler;

function webRequestListener(listener: StateListener) {
  return ({ options: { postPage } }: State, dispatch: Dispatch) => {
    if (postPage) {
      if (!chrome.webRequest.onBeforeRequest.hasListeners()) {
        chrome.webRequest.onBeforeRequest.addListener(listener(onBeforeRequestHandler), { urls: ["*://*/*"] }, ["requestBody"]);
      }
      if (!chrome.tabs.onRemoved.hasListeners()) {
        chrome.tabs.onRemoved.addListener(listener(onRemovedTabsHandler));
      }
    } else {
      if (chrome.webRequest.onBeforeRequest.hasListeners()) {
        chrome.webRequest.onBeforeRequest.removeListener(listener(onBeforeRequestHandler));
      }
      if (chrome.tabs.onRemoved.hasListeners()) {
        chrome.tabs.onRemoved.removeListener(listener(onRemovedTabsHandler));
        dispatch(webRequest.actions.removePostDataAll());
      }
    }
  }
}

// function saveOptions(options: IOptions) {
//   const promise = new Promise((resolve) => {
//     chrome.storage.local.set(options, resolve);
//   });
//   dispatch(sliceOptions.actions.save(options));
//   return promise;
// }

function getSavedOptions(dispatch: Dispatch, initialOptions: IOptions) {
  chrome.storage.local.get((items) => {
    dispatch(sliceOptions.actions.save({ ...initialOptions, ...items }));
  });
}

const initialOptions = {
  postPage: true,
}

export function connect(subscribe: StateSubscriber, listener: StateListener, dispatch: Dispatch) {
  subscribe(webRequestListener(listener), ['options']);
  getSavedOptions(dispatch, initialOptions);
}
