import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  State,
  Dispatch,
  AnyDispatch,
  StateSubscriber,
  StateListener,
} from './redux-provider';
import * as F from './utils';
import { $ } from './utils';
import {
  BxLeaf,
  // LeafProps,
  BxNode,
  // nodeProps,
} from './custom-elements';
import * as bx from './types';

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

export interface IBookmark extends Pick<chrome.bookmarks.BookmarkTreeNode, 'id' | 'url'>{
  content: string,
  indent: number,
  parentId?: number;
  childrenIds?: number[];
}

interface IBookmarks {
  [id: number]: Omit<IBookmark, 'id'>;
}

const bookmarks = createSlice({
  initialState: {} as IBookmarks,
  name: 'bookmarks',
  reducers: {
    update: (state: IBookmarks, { payload }: PayloadAction<IBookmarks>) => (
      { ...state, ...payload }
    ),
  },
});

// Exports Redux toolkit Slice

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
  dispatch(sliceOptions.actions.update({ ...initOptions, ...items }));
}

type Bookmarks = Omit<IBookmark, 'children' | 'parentId'> & {
  parentId?: string
  children?: Bookmarks[]
};

function flattenBookmarksTree(bookmarksTree: Bookmarks[]): IBookmarks {
  return bookmarksTree.reduce((acc, {
    id, content, url, parentId, children,
  }) => {
    const childrenIds = children?.map((child) => Number(child.id));
    const thisChildren = children ? flattenBookmarksTree(children) : {};
    return {
      ...acc,
      [id]: {
        content, url, parentId, childrenIds,
      },
      ...thisChildren,
    };
  }, {} as IBookmarks);
}

function digBookmarks({
  id, title, url, parentId, children,
}: chrome.bookmarks.BookmarkTreeNode, indent = 0): Bookmarks {
  return {
    id,
    url,
    parentId,
    indent,
    content: title,
    children: children?.map((child) => digBookmarks(child, indent)),
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

customElements.define('bx-leaf', BxLeaf, { extends: 'div' });
customElements.define('bx-node', BxNode, { extends: 'div' });

const BxLeaf1 = customElements.get('bx-leaf') as typeof BxLeaf;
const BxNode1 = customElements.get('bx-node') as typeof BxNode;

type BookmarkElements = (BxLeaf | BxNode)[];

function addBookmark(
  id: number,
  nodes: IBookmarks,
  elements: BookmarkElements,
): BookmarkElements {
  const node = nodes[id];
  if (node.childrenIds) {
    const children = node.childrenIds.flatMap((childId) => addBookmark(childId, nodes, elements));
    return [...elements, new BxNode1({ ...node, id: String(id) }), ...children];
  }
  const sUrl = `${node.content}\n${node.url?.substring(0, 128)}...`;
  return [...elements, new BxLeaf1({ ...node, id: String(id), sUrl })];
}

function makeHtmlBookmarks(state: State) {
  const leafs = addBookmark(0, state.bookmarks, []);
  $('#bookmarks').append(...leafs);
}

// Popup messaging

// const sendMessage = chrome.runtime.sendMessage.bind(chrome.runtime) as SendMessage;

chrome.runtime.onMessage.addListener((msg: bx.Message, _, sendResponse) => {
  // eslint-disable-next-line no-console
  console.log(msg);
  switch (msg.type) {
    case bx.MessageTypes.clRequestHtml:
      sendResponse($('#bookmarks').innerHTML);
      break;
    default:
      break;
  }
});

// Connect Redux

export async function connect(
  subscribe: StateSubscriber,
  listener: StateListener,
  dispatch: Dispatch,
) {
  subscribe(webRequestListener(listener), ['options']);
  await getSavedOptions(dispatch, initialOptions);
  // listener(saveOptions);
  await getBookmarksTree(dispatch)(F.cbToPromise(chrome.bookmarks.getTree));
  subscribe(makeHtmlBookmarks, ['bookmarks'], true);
}
