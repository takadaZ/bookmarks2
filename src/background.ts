import { createStore, combineReducers } from 'redux';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

function $<T extends HTMLElement>(selector: string, parent: HTMLElement | Document = document) {
  return parent.querySelector(selector) as T;
}

function $$<T extends HTMLElement[]>(selector: string, parent: HTMLElement | Document = document) {
  return [...parent.querySelectorAll(selector)] as T;
}

(async () => {

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
        if (payload.frameId === 0 && payload.type === 'main_frame' && payload.method === 'POST' && payload.requestBody) {
          return { ...state, [payload.tabId]: { formData: payload.requestBody.formData } };
        }
      },
      removePostData: (state: IRequestInfo, { payload }: PayloadAction<number>) => {
        return { ...state, [payload]: null };
      },
      removePostDataAll: () => ({})
    }
  });

  async function getSavedOptions(initialState: IOptions) {
    return new Promise<IOptions>((resolve) => {
      chrome.storage.local.get((items) => resolve({ ...initialState, ...items }));
    });
  }

  const initialStateOptions = await getSavedOptions({
    postPage: true,
  });

  const sliceOptions = createSlice({
    initialState: initialStateOptions,
    name: 'options',
    reducers: {
      save: (state: IOptions, { payload }: PayloadAction<IOptions>) => {
        return { ...state, ...payload };
      }
    }
  });

  const reducer = combineReducers({
    webRequest: webRequest.reducer,
    options: sliceOptions.reducer,
  });

  const store = createStore(reducer);

  type State = ReturnType<typeof store.getState>;
  type StateHandler = (state: State, element?: HTMLElement) => void;

  function connect(handler: StateHandler, immediate: boolean = false, element?: HTMLElement) {
    store.subscribe(() => {
      const state = store.getState();
      handler(state, element);
    });
    if (immediate) {
      handler(store.getState(), element);
    }
  }

  function onBeforeRequestHandler(resp: chrome.webRequest.WebRequestBodyDetails) {
    store.dispatch(webRequest.actions.request(resp));
  }

  function onRemovedTabsHandler(tabId: number) {
    store.dispatch(webRequest.actions.removePostData(tabId));
  }

  function webRequestListener({ options: { postPage } }: State) {
    if (postPage) {
      if (!chrome.webRequest.onBeforeRequest.hasListeners()) {
        chrome.webRequest.onBeforeRequest.addListener(onBeforeRequestHandler, { urls: ["*://*/*"] }, ["requestBody"]);
      }
      if (!chrome.tabs.onRemoved.hasListeners()) {
        chrome.tabs.onRemoved.addListener(onRemovedTabsHandler);
      }
    } else {
      if (chrome.webRequest.onBeforeRequest.hasListeners()) {
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestHandler);
      }
      if (chrome.tabs.onRemoved.hasListeners()) {
        chrome.tabs.onRemoved.removeListener(onRemovedTabsHandler);
        store.dispatch(webRequest.actions.removePostDataAll());
      }
    }
  }

  function saveOptions(options: IOptions) {
    const promise = new Promise((resolve) => {
      chrome.storage.local.set(options, resolve);
    });
    store.dispatch(sliceOptions.actions.save(options));
    return promise;
  }

  connect(webRequestListener, true);

})();
