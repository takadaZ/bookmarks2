import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { State, Dispatch, StateSubscriber, StateListener } from './redux-provider';

// SliceReducers

interface IRequestInfo {
  [tabId: number]: {
    formData?: {
      [key: string]: string[],
    }
  } | null
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
    removePostDataAll: () => ({}),
  }
});

interface IOptions {
  postPage: boolean,
}

const sliceOptions = createSlice({
  initialState: {} as IOptions,
  name: 'options',
  reducers: {
    update: (state: IOptions, { payload }: PayloadAction<IOptions>) => {
      return { ...state, ...payload };
    },
  }
});

const bookmarks = createSlice({
  initialState: {} as IBookmarks[],
  name: 'bookmarks',
  reducers: {
    update: (state: IBookmarks[], { payload }: PayloadAction<IBookmarks[]>) => {
      return { ...state, ...payload };
    },
  }
});

// Exports Slices

export const slices = {
  webRequest,
  options: sliceOptions,
  bookmarks,
};

// Functions

function onBeforeRequestHandler(state: State, dispatch: Dispatch, details: chrome.webRequest.WebRequestBodyDetails) {
  if (details && details.frameId === 0 && details.type === 'main_frame' && details.method === 'POST' && details.requestBody) {
    dispatch(webRequest.actions.request(details));
  }
}

function onRemovedTabsHandler(state: State, dispatch: Dispatch, tabId: number) {
  dispatch(webRequest.actions.removePostData(tabId));
}

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

const initialOptions = {
  postPage: true,
}

function saveOptions(state: State, dispatch: Dispatch, options: IOptions) {
  const promise = new Promise((resolve) => {
    chrome.storage.local.set(options, resolve);
  });
  dispatch(sliceOptions.actions.update(options));
  return promise;
}

function getSavedOptions(dispatch: Dispatch, initialOptions: IOptions) {
  return new Promise((resolve) => {
    chrome.storage.local.get((items) => {
      dispatch(sliceOptions.actions.update({ ...initialOptions, ...items }));
      resolve();
    });
  });
}

type Bookmarks = {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children: Bookmarks[] | null;
}

function digBookmarks({ id, title, url, parentId, children }: chrome.bookmarks.BookmarkTreeNode): Bookmarks {
  return {
    id,
    title,
    url,
    parentId,
    children: children ? children.map((child) => digBookmarks(child)) : null,
  }
}

function getBookmarksTree(dispatch: Dispatch) {
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((treeNode) => {
      const bookmarksTree = treeNode.map((node) => digBookmarks(node));
      const bookmarksFlat = flattenBookmarksTree(bookmarksTree);
      dispatch(bookmarks.actions.update(bookmarksFlat));
      resolve();
    });
  });
}

interface IBookmarks {
  id: string;
  title: string;
  url?: string;
  parentId?: string;
  children: string[];
}

function flattenBookmarksTree(bookmarksTree: Bookmarks[]): IBookmarks[] {
  return bookmarksTree.reduce((acc, bookmark) => {
    const childrenIds = bookmark.children?.map(({ id }) => id) || [];
    const children = bookmark.children ? flattenBookmarksTree(bookmark.children) : [];
    return [...acc, { ...bookmark, children: childrenIds }, ...children];
  }, [] as IBookmarks[]);
}

// Connect

export async function connect(subscribe: StateSubscriber, listener: StateListener, dispatch: Dispatch) {
  subscribe(webRequestListener(listener), ['options']);
  await getSavedOptions(dispatch, initialOptions);
  // listener(saveOptions);
  await getBookmarksTree(dispatch);
  // subscribe(flattenBookmarks, ['bookmarks']);
}
