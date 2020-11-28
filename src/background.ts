/* eslint-disable import/no-unresolved */
import {
  createSlice,
  PayloadAction,
  State,
  Dispatch,
  AnyDispatch,
  StateSubscriber,
  StateListener,
  ReduxHandlers,
} from './redux-provider';
import * as F from './utils';
import { $, $$ } from './utils';
import * as bx from './types';
import {
  BookmarkElements,
  BxLeaf,
  BxNode,
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
  parentId?: string;
  childIds?: string[];
}

interface IBookmarks {
  [id: string]: Omit<IBookmark, 'id'>;
}

const bookmarks = createSlice({
  initialState: {} as IBookmarks,
  name: 'bookmarks',
  reducers: {
    // eslint-disable-next-line arrow-body-style
    update: (state: IBookmarks, { payload }: PayloadAction<IBookmarks>) => {
      return { ...state, ...payload };
    },
    add: (state: IBookmarks, { payload }: PayloadAction<IBookmarks>) => (
      { ...state, ...payload }
    ),
    remove: (state: IBookmarks, { payload }: PayloadAction<string>) => {
      const { [payload]: omitted, ...rest } = state;
      return rest;
    },
  },
});

const bookmarksHtml = createSlice({
  initialState: {} as bx.IHtml,
  name: 'html',
  reducers: {
    created: (_: bx.IHtml, { payload }: PayloadAction<bx.IHtml>) => (
      payload
    ),
  },
});

const clientState = createSlice({
  initialState: {} as bx.IClientState,
  name: 'clientState',
  reducers: {
    update: (_: bx.IClientState, { payload }: PayloadAction<bx.IClientState>) => (
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
  { dispatch } : ReduxHandlers,
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

function onRemovedTabsHandler({ dispatch }: ReduxHandlers, tabId: number) {
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
    const childIds = children?.map((child) => child.id);
    const thisChildren = children ? flattenBookmarksTree(children) : {};
    return {
      ...acc,
      [id]: {
        content, url, parentId, childIds,
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
    bookmarks.actions.update,
    dispatch,
  );
}

customElements.define('bx-leaf', BxLeaf, { extends: 'div' });
customElements.define('bx-node', BxNode, { extends: 'div' });

const BxLeaf1 = customElements.get('bx-leaf') as typeof BxLeaf;
const BxNode1 = customElements.get('bx-node') as typeof BxNode;

function buildBookmarks(
  id: string,
  nodes: IBookmarks,
  elements: BookmarkElements,
): BookmarkElements {
  const node = nodes[id];
  if (node.url == null) {
    const children = node.childIds?.flatMap(
      (childId) => buildBookmarks(childId, nodes, elements),
    );
    return [...elements, new BxNode1({ ...node, id, nodes: children || [] })];
  }
  const sUrl = `${node.content}\n${node.url?.substring(0, 128)}...`;
  return [...elements, new BxLeaf1({ ...node, id, sUrl })];
}

function makeHtmlBookmarks(state: State, dispatch: Dispatch) {
  const [root] = buildBookmarks('0', state.bookmarks, []);
  const $leafs = $('#leafs')!;
  $leafs.innerHTML = '';
  $leafs.append(...root.children);
  const leafs = $leafs.innerHTML;
  const [rootFolder] = buildBookmarks('0', state.bookmarks, []);
  const $folders = $('#folders')!;
  $folders.innerHTML = '';
  $folders.append(...$(`:scope > ${F.cssid(1)}`, rootFolder)!.children);
  $folders.append(...$$(`:scope > .folder:not(${F.cssid(1)})`, rootFolder));
  $$('.leaf:not([data-parent-id="1"])', $folders).forEach((leaf) => leaf.remove());
  $(':scope > .marker', $folders)!.remove();
  const folders = $folders.innerHTML;
  dispatch(bookmarksHtml.actions.created({ leafs, folders }));
}

// Popup messaging

export const mapStateToResponse = {
  [bx.CliMessageTypes.initialize]: ({ state }: ReduxHandlers) => ({
    options: state.options,
    html: state.html,
    clState: state.clientState,
  }),
  [bx.CliMessageTypes.saveState]:
    ({ dispatch }: ReduxHandlers, { payload }: PayloadAction<bx.IClientState>) => {
      dispatch(clientState.actions.update(payload));
    },
  [bx.CliMessageTypes.saveOptions]:
    ({ dispatch }: ReduxHandlers, { payload }: PayloadAction<bx.IOptions>) => {
      dispatch(sliceOptions.actions.update(payload));
    },
  [bx.CliMessageTypes.openBookmark]:
    async ({ state }: ReduxHandlers, { payload }: PayloadAction<bx.OpenBookmarkTypes>) => {
      switch (payload.openType) {
        case bx.OpenBookmarkType.tab: {
          const tab = await F.getCurrentTab();
          chrome.tabs.create({
            index: tab.index + 1,
            windowId: tab.windowId,
            url: state.bookmarks[payload.id].url,
          });
          break;
        }
        case bx.OpenBookmarkType.window: {
          chrome.windows.create({ url: state.bookmarks[payload.id].url });
          break;
        }
        case bx.OpenBookmarkType.incognito: {
          chrome.windows.create({
            url: state.bookmarks[payload.id].url,
            incognito: true,
          });
          break;
        }
        default:
      }
    },
  [bx.CliMessageTypes.addBookmark]:
    async ({ subscribe }: ReduxHandlers, { payload }: PayloadAction<string>) => {
      const { title, url } = await F.getCurrentTab();
      const index = (payload === '1') ? 0 : undefined;
      const creator = F.curry(chrome.bookmarks.create)({
        title,
        url,
        parentId: payload,
        index,
      });
      const { id } = await F.cbToPromise(creator);
      const [html, exists] = await new Promise<[string | undefined, boolean]>((resolve) => {
        const test = !!document.getElementById(id);
        if (test) {
          return resolve(['', test]);
        }
        return subscribe(() => resolve([$(F.cssid(id))?.outerHTML, test]), ['html', 'created'], true);
      });
      return { id, html, exists };
    },
  [bx.CliMessageTypes.removeBookmark]:
    async ({ subscribe }: ReduxHandlers, { payload }: PayloadAction<string>) => {
      F.cbToPromise(F.curry(chrome.bookmarks.remove)(payload));
      const succeed = await new Promise<boolean>((resolve) => {
        subscribe(() => resolve(true), ['html', 'created'], true);
      });
      return succeed;
    },
  [bx.CliMessageTypes.getUrl]:
    ({ state }: ReduxHandlers, { payload }: PayloadAction<string>) => (
      state.bookmarks[Number(payload)].url
    ),
  [bx.CliMessageTypes.editBookmark]:
    async ({ subscribe }: ReduxHandlers, { payload }: PayloadAction<bx.EditBookmarkTypes>) => {
      const changes = { [payload.editType]: payload.value };
      const succeed = await new Promise<{ title: string, style: string }>((resolve) => {
        subscribe(() => {
          const anchor = $(`#${CSS.escape(payload.id)} > a`);
          resolve({
            title: anchor?.getAttribute('title')!,
            style: anchor?.getAttribute('style')!,
          });
        }, ['html', 'created'], true);
        F.cbToPromise(F.curry(chrome.bookmarks.update)(payload.id, changes));
      });
      return succeed;
    },
  [bx.CliMessageTypes.editFolder]:
    async (
      { subscribe }: ReduxHandlers,
      { payload: { id, title } }: PayloadAction<{ id: string, title:string }>,
    ) => {
      F.cbToPromise(F.curry(chrome.bookmarks.update)(id, { title }));
      const succeed = await new Promise<boolean>((resolve) => {
        subscribe(() => resolve(true), ['html', 'created'], true);
      });
      return succeed;
    },
  [bx.CliMessageTypes.addFolder]:
    async (
      { subscribe }: ReduxHandlers,
      { payload: { parentId, title } }: PayloadAction<{ parentId: string, title:string }>,
    ) => {
      const index = (parentId === '1') ? 0 : undefined;
      const { id } = await F.cbToPromise(F.curry(chrome.bookmarks.create)({
        parentId,
        title,
        index,
      }));
      const [html, exists] = await new Promise<[string | undefined, boolean]>((resolve) => {
        const test = !!document.getElementById(id);
        if (test) {
          return resolve(['', test]);
        }
        return subscribe(() => resolve([$(F.cssid(id))?.outerHTML, test]), ['html', 'created'], true);
      });
      return { id, html, exists };
    },
  [bx.CliMessageTypes.removeFolder]:
    async ({ subscribe }: ReduxHandlers, { payload }: PayloadAction<string>) => {
      F.cbToPromise(F.curry(chrome.bookmarks.removeTree)(payload));
      const succeed = await new Promise<boolean>((resolve) => {
        subscribe(() => resolve(true), ['html', 'created'], true);
      });
      return succeed;
    },
  [bx.CliMessageTypes.moveItem]:
    async (
      { state, subscribe }: ReduxHandlers,
      { payload: { id, targetId, dropClass } }: PayloadAction<bx.PayloadMoveItem>,
    ) => {
      const tree = state.bookmarks[targetId];
      const [parentId, index] = (() => {
        if (dropClass === 'drop-folder') {
          return [targetId, tree.childIds?.length || 0] as const;
        }
        const { childIds } = state.bookmarks[tree.parentId!];
        const findIndex = childIds?.findIndex((childId) => childId === targetId);
        if (findIndex == null || findIndex === -1) {
          return ['', null] as const;
        }
        return [tree.parentId, findIndex + (dropClass === 'drop-bottom' ? 1 : 0)] as const;
      })();
      if (parentId == null || index == null) {
        return {
          parentId: null,
          index: null,
        };
      }
      const lastState = await new Promise<State>((resolve) => {
        subscribe((state2: State) => resolve(state2), ['html', 'created'], true);
        F.cbToPromise(F.curry(chrome.bookmarks.move)(id, { parentId, index }));
      });
      if (parentId === '1' || !!state.bookmarks[id].url) {
        return { parentId, index };
      }
      if (lastState) {
        const { childIds } = lastState.bookmarks[parentId];
        const findIndex = childIds?.findIndex((childId) => childId === id);
        const nextChildren = childIds?.slice(findIndex! + 1);
        const nextFolderId = nextChildren?.find((childId) => (
          !lastState.bookmarks[childId].url
        ));
        return { parentId, index, nextFolderId };
      }
      return {
        parentId: null,
        index: null,
      };
    },
};

export type MapStateToResponse = typeof mapStateToResponse;

async function onClientRequest(
  reduxHandlers: ReduxHandlers,
  message: { type: keyof MapStateToResponse } & PayloadAction<any>,
  _: any,
  sendResponse: any,
) {
  // eslint-disable-next-line no-console
  console.log(message);
  const responseState = await mapStateToResponse[message.type](reduxHandlers, message);
  sendResponse(responseState);
}

async function buildFolderState(state: State, folderId: string) {
  const [node] = await F.cbToPromise(F.curry(chrome.bookmarks.getSubTree)(folderId));
  const childIds = node.children?.map(({ id }) => id);
  const currentState = state.bookmarks[folderId];
  return {
    [folderId]: {
      parentId: node.parentId,
      content: currentState.content,
      childIds,
    },
  };
}

async function updateFolderState(state: State, dispatch: Dispatch, parentId: string) {
  const folderState = await buildFolderState(state, parentId);
  dispatch(bookmarks.actions.update(folderState));
}

async function onCreatedBookmark(
  { state, dispatch }: ReduxHandlers,
  id: string,
  treeNode: chrome.bookmarks.BookmarkTreeNode,
) {
  const parentId = treeNode.parentId!;
  dispatch(bookmarks.actions.add({
    [id]: {
      parentId,
      url: treeNode.url,
      content: treeNode.title,
    },
  }));
  updateFolderState(state, dispatch, parentId);
}

async function onRemovedBookmark(
  { state, dispatch }: ReduxHandlers,
  id: string,
  removeInfo: chrome.bookmarks.BookmarkRemoveInfo,
) {
  dispatch(bookmarks.actions.remove(id));
  updateFolderState(state, dispatch, removeInfo.parentId);
}

function onChangedBookmark(
  { state, dispatch }: ReduxHandlers,
  id: string,
  { title, url }: chrome.bookmarks.BookmarkChangeInfo,
) {
  const { [id]: bookmark } = state.bookmarks;
  dispatch(bookmarks.actions.update({
    [id]: { ...bookmark, url, content: title },
  }));
}

async function onMovedBookmark(
  { state, dispatch }: ReduxHandlers,
  id: string,
  { parentId, oldParentId }: chrome.bookmarks.BookmarkMoveInfo,
) {
  const currentNode = { ...state.bookmarks[id], parentId };
  const folderState = await buildFolderState(state, parentId);
  if (parentId === oldParentId) {
    dispatch(bookmarks.actions.update({ [id]: currentNode, ...folderState }));
    return;
  }
  const folderState2 = await buildFolderState(state, oldParentId);
  dispatch(bookmarks.actions.update({ [id]: currentNode, ...folderState, ...folderState2 }));
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
  getBookmarksTree(dispatch)(F.cbToPromise(chrome.bookmarks.getTree));
  subscribe(makeHtmlBookmarks, ['bookmarks', 'update']);
  chrome.bookmarks.onCreated.addListener(listener(onCreatedBookmark));
  chrome.bookmarks.onRemoved.addListener(listener(onRemovedBookmark));
  chrome.bookmarks.onChanged.addListener(listener(onChangedBookmark));
  chrome.bookmarks.onMoved.addListener(listener(onMovedBookmark));
  chrome.runtime.onMessage.addListener(listener(onClientRequest));
}
