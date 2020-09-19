import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  State,
  Dispatch,
  AnyDispatch,
  StateSubscriber,
  StateListener,
} from './redux-provider';
import * as F from './utils';

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
    request: (
      state: IRequestInfo,
      { payload }: PayloadAction<chrome.webRequest.WebRequestBodyDetails>,
    ) => ({ ...state, [payload.tabId]: { formData: payload.requestBody.formData } }),
    removePostData: (state: IRequestInfo, { payload }: PayloadAction<number>) => (
      { ...state, [payload]: null }
    ),
    removePostDataAll: () => ({}),
  },
});

interface IOptions {
  postPage: boolean,
}

const sliceOptions = createSlice({
  initialState: {} as IOptions,
  name: 'options',
  reducers: {
    update: (state: IOptions, { payload }: PayloadAction<IOptions>) => (
      { ...state, ...payload }
    ),
  },
});

interface IBookmarks extends Pick<
  chrome.bookmarks.BookmarkTreeNode,
  'id' | 'title' | 'url' | 'parentId'
>{
  children: string[];
}

const bookmarks = createSlice({
  initialState: {} as IBookmarks[],
  name: 'bookmarks',
  reducers: {
    update: (state: IBookmarks[], { payload }: PayloadAction<IBookmarks[]>) => (
      { ...state, ...payload }
    ),
  },
});

// Exports Slices

export const slices = {
  webRequest,
  options: sliceOptions,
  bookmarks,
};

// Functions

function onBeforeRequestHandler(
  _: State,
  dispatch: Dispatch,
  details: chrome.webRequest.WebRequestBodyDetails,
) {
  if (
    details
    && details.frameId === 0
    && details.type === 'main_frame'
    && details.method === 'POST'
    && details.requestBody
  ) {
    dispatch(webRequest.actions.request(details));
  }
}

function onRemovedTabsHandler(_: State, dispatch: Dispatch, tabId: number) {
  dispatch(webRequest.actions.removePostData(tabId));
}

function webRequestListener(listener: StateListener) {
  return ({ options: { postPage } }: State, dispatch: Dispatch) => {
    if (postPage) {
      if (!chrome.webRequest.onBeforeRequest.hasListeners()) {
        chrome.webRequest.onBeforeRequest.addListener(listener(onBeforeRequestHandler), { urls: ['*://*/*'] }, ['requestBody']);
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
  };
}

const initialOptions = {
  postPage: true,
};

// function saveOptions(state: State, dispatch: Dispatch, options: IOptions) {
//   const promise = new Promise((resolve) => {
//     chrome.storage.local.set(options, resolve);
//   });
//   dispatch(sliceOptions.actions.update(options));
//   return promise;
// }

async function getSavedOptions(dispatch: Dispatch, initOptions: IOptions) {
  const items = await new Promise<{ [key: string]: any }>((resolve) => {
    chrome.storage.local.get('bookmarks2', resolve);
  });
  // const items = await F.cbToPromise(F.curry(chrome.storage.local.get)('bookmarks2'));
  dispatch(sliceOptions.actions.update({ ...initOptions, ...items }));
}

type Bookmarks = Omit<IBookmarks, 'children'> & { children?: Bookmarks[] };

function flattenBookmarksTree(bookmarksTree: Bookmarks[]): IBookmarks[] {
  return bookmarksTree.reduce((acc, bookmark) => {
    const childrenIds = bookmark.children?.map(({ id }) => id) || [];
    const children = bookmark.children ? flattenBookmarksTree(bookmark.children) : [];
    return [...acc, { ...bookmark, children: childrenIds }, ...children];
  }, [] as IBookmarks[]);
}

function digBookmarks({
  id, title, url, parentId, children,
}: chrome.bookmarks.BookmarkTreeNode): Bookmarks {
  return {
    id,
    title,
    url,
    parentId,
    children: children?.map((child) => digBookmarks(child)),
  };
}

function getBookmarksTree(dispatch: AnyDispatch) {
  return F.pipeP(
    F.map(digBookmarks),
    flattenBookmarksTree,
    bookmarks.actions.update,
    dispatch,
  );
}

// Connect

export async function connect(
  subscribe: StateSubscriber,
  listener: StateListener,
  dispatch: Dispatch,
) {
  subscribe(webRequestListener(listener), ['options']);
  await getSavedOptions(dispatch, initialOptions);
  // listener(saveOptions);
  await getBookmarksTree(dispatch)(F.cbToPromise(chrome.bookmarks.getTree));
}
