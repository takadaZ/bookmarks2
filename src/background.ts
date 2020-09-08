import { createStore } from 'redux';
import { createReducer, createSlice } from '@reduxjs/toolkit';

function $<T extends HTMLElement>(selector: string, parent: HTMLElement | Document = document) {
  return parent.querySelector(selector) as T;
}

function $$<T extends HTMLElement[]>(selector: string, parent: HTMLElement | Document = document) {
  return [...parent.querySelectorAll(selector)] as T;
}

interface IRequestInfo {
  [tabId: number]: {
    formData: {
      [key: string]: string[],
    }
  }
}

interface IState {
  requestInfo: IRequestInfo,
  options: {
    postPage: boolean;
  }
}

const initialState = {
  requestInfo: {},
  options: {
    postPage: true,
  },
}

const slice = createSlice({
  initialState,
  name: 'all',
  reducers: {
    postRequest: (state: IState, { payload }: { payload: chrome.webRequest.WebRequestBodyDetails }) => {
      if (payload.frameId === 0 && payload.type === 'main_frame' && payload.method === 'POST' && payload.requestBody) {
        return { ...state, requestInfo: { ...state.requestInfo, [payload.tabId]: { formData: payload.requestBody.formData } } };
      }
    },
    removePostData: (state: IState, { payload }: { payload: number }) => {
      return { ...state, requestInfo: { ...state.requestInfo, [payload]: null } };
    },
    removePostDataAll: (state: IState) => {
      return { ...state, requestInfo: {} };
    }
  },
});

const store = createStore(slice.reducer);

function onBeforeRequestHandler(resp: chrome.webRequest.WebRequestBodyDetails) {
  store.dispatch(slice.actions.postRequest(resp));
}

function onRemovedTabsHandler(tabId: number) {
  store.dispatch(slice.actions.removePostData(tabId));
}

if (initialState.options.postPage) {
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
    store.dispatch(slice.actions.removePostDataAll());
  }
}
