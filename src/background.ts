import {
  createSlice,
  PayloadAction,
  State,
  Dispatch,
  AnyDispatch,
  StateSubscriber,
  StateListener,
} from './redux-provider';
import * as F from './utils';
import { $, $$ } from './utils';
import * as bx from './types';
import {
  BookmarkElements,
  BxLeaf,
  // LeafProps,
  BxNode,
  // nodeProps,
} from './custom-elements';

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

const sliceOptions = createSlice({
  initialState: {} as bx.IOptions,
  name: 'options',
  reducers: {
    update: (state: bx.IOptions, { payload }: PayloadAction<bx.IOptions>) => (
      { ...state, ...payload }
    ),
  },
});

export interface IBookmark extends Pick<chrome.bookmarks.BookmarkTreeNode, 'id' | 'url'>{
  content: string,
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
    refresh: (state: IBookmarks, { payload }: PayloadAction<IBookmarks>) => (
      { ...state, ...payload }
    ),
  },
});

const bookmarksHtml = createSlice({
  initialState: {} as bx.IHtml,
  name: 'html',
  reducers: {
    created: (state: bx.IHtml, { payload }: PayloadAction<bx.IHtml>) => (
      payload
    ),
  },
});

const clientState = createSlice({
  initialState: {} as bx.IClientState,
  name: 'clientState',
  reducers: {
    update: (state: bx.IClientState, { payload }: PayloadAction<bx.IClientState>) => (
      payload
    ),
  },
});

// Exports Redux toolkit Slice

export const slices = {
  webRequest,
  options: sliceOptions,
  bookmarks,
  html: bookmarksHtml,
  clientState,
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

// function saveOptions(state: State, dispatch: Dispatch, options: IOptions) {
//   const promise = new Promise((resolve) => {
//     chrome.storage.local.set(options, resolve);
//   });
//   dispatch(sliceOptions.actions.update(options));
//   return promise;
// }

async function getSavedOptions(dispatch: Dispatch, initOptions: bx.IOptions) {
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
}: chrome.bookmarks.BookmarkTreeNode): Bookmarks {
  return {
    id,
    url,
    parentId,
    content: title,
    children: children?.map((child) => digBookmarks(child)),
  };
}

function getBookmarksTree(dispatch: AnyDispatch) {
  return F.pipeP(
    F.map(digBookmarks),
    flattenBookmarksTree,
    bookmarks.actions.refresh,
    dispatch,
  );
}

customElements.define('bx-leaf', BxLeaf, { extends: 'div' });
customElements.define('bx-node', BxNode, { extends: 'div' });

const BxLeaf1 = customElements.get('bx-leaf') as typeof BxLeaf;
const BxNode1 = customElements.get('bx-node') as typeof BxNode;

function buildBookmarks(
  subscribe: StateSubscriber,
  id: number,
  nodes: IBookmarks,
  elements: BookmarkElements,
): BookmarkElements {
  const node = nodes[id];
  if (node.childrenIds) {
    const children = node.childrenIds.flatMap(
      (childId) => buildBookmarks(subscribe, childId, nodes, elements),
    );
    return [...elements, new BxNode1({ ...node, nodes: children, id: String(id) })];
  }
  const sUrl = `${node.content}\n${node.url?.substring(0, 128)}...`;
  return [...elements, new BxLeaf1({ ...node, id: String(id), sUrl })];
}

function makeHtmlBookmarks(subscribe: StateSubscriber) {
  return (state: State, dispatch: Dispatch) => {
    const [root] = buildBookmarks(subscribe, 0, state.bookmarks, []);
    const $leafs = $('#leafs');
    $leafs.append(...root.children);
    const leafs = $leafs.innerHTML;
    const [rootFolder] = buildBookmarks(subscribe, 0, state.bookmarks, []);
    const $folders = $('#folders');
    $folders.append(...$(':scope > [id="1"]', rootFolder).children);
    $folders.append(...$$(':scope > .folder:not([id="1"])', rootFolder));
    $$('.leaf:not([data-parent-id="1"])').forEach((leaf) => leaf.remove());
    $(':scope > .marker', $folders).remove();
    const folders = $folders.innerHTML;
    dispatch(bookmarksHtml.actions.created({ leafs, folders }));
  };
}

// Popup messaging

export const mapStateToResponse = {
  [bx.MessageTypes.clRequestInitial]: (state: State) => ({
    options: state.options,
    html: state.html,
    clState: state.clientState,
  }),
  [bx.MessageTypes.clRequestSaveState]: (_: State, dispatch: Dispatch, message: bx.Message) => {
    dispatch(clientState.actions.update(message.clState!));
  },
  [bx.MessageTypes.clRequestHtml]: (state: State) => state.html,
  [bx.MessageTypes.clRequestOptions]: (state: State) => state.options,
};

function onClientRequest(
  state: State,
  dispatch: Dispatch,
  message: bx.Message,
  _: any,
  sendResponse: any,
) {
  // eslint-disable-next-line no-console
  console.log(message);
  const responseState = mapStateToResponse[message.type](state, dispatch, message);
  sendResponse(responseState);
}

function regsterClientlistener(listener: StateListener) {
  chrome.runtime.onMessage.addListener(listener(onClientRequest));
}

// Connect Redux

export async function connect(
  subscribe: StateSubscriber,
  listener: StateListener,
  dispatch: Dispatch,
) {
  subscribe(webRequestListener(listener), ['options', 'update']);
  await getSavedOptions(dispatch, bx.initialOptions);
  // listener(saveOptions);
  await getBookmarksTree(dispatch)(F.cbToPromise(chrome.bookmarks.getTree));
  subscribe(makeHtmlBookmarks(subscribe), ['bookmarks', 'refresh']);
  // subscribe(sendHtml, ['html', 'created']);
  regsterClientlistener(listener);
}
