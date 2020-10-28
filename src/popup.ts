import './style.scss';
import { $, $$ } from './utils';
import * as F from './utils';
import * as bx from './types';

function setClientState(clState: bx.IClientState) {
  clState.paths?.forEach((id) => $(`.folders ${F.cssid(id)}`)?.classList.add('path'));
  if (clState.open) {
    $$(F.cssid(clState.open))?.forEach((el) => el.classList.add('open'));
  }
}

function repaleceHtml(html: bx.IHtml) {
  $('.leafs').innerHTML = html.leafs;
  $('.folders').innerHTML = html.folders;
}

function assignStyle(selector: string, style: Partial<CSSStyleDeclaration>) {
  Object.assign($(selector).style, style);
}

function setOptions(options: bx.IOptions) {
  assignStyle('body', {
    width: `${options.width}px`,
    height: `${options.height}px`,
    backgroundColor: options.bodyBackgroundColor,
    color: options.bodyColor,
  });
  assignStyle('main', {
    gridTemplateColumns: `min-content 1fr min-content ${options.rightWidth}px`,
  });
  assignStyle('.leafs', {
    backgroundColor: options.leafsBackgroundColor,
  });
}

function init() {
  $('.query').focus();
}

(async () => {
  const { options, html, clState } = await F.postMessage({ type: bx.CliMessageTypes.initialize });

  if (document.readyState === 'loading') {
    await F.cbToPromise(F.swap(F.curry(F.curry(document.addEventListener))('DOMContentLoaded'))(false));
  }
  setOptions(options);
  repaleceHtml(html);
  setClientState(clState);
  // eslint-disable-next-line no-use-before-define
  setEventListners();
  init();
})();

function openBookmark(
  target: EventTarget | HTMLElement,
  openType: keyof typeof bx.OpenBookmarkType = bx.OpenBookmarkType.tab,
) {
  const { id } = (target as HTMLAnchorElement).parentElement!;
  F.postMessage({
    type: bx.CliMessageTypes.openBookmark,
    payload: {
      id,
      openType,
    },
  });
}

function onClickAngle(e: MouseEvent) {
  const target = e.target as HTMLAnchorElement;
  const folder = target.parentElement?.parentElement!;
  if ($('.open', folder)) {
    (target.nextElementSibling as HTMLDivElement)?.click();
  }
  folder.classList.toggle('path');
}

function sendStateOpenedPath(foldersFolder: HTMLElement) {
  $$('.path').forEach((el) => el.classList.remove('path'));
  let paths: Array<string> = [];
  let folder = foldersFolder;
  while (folder.classList.contains('folder')) {
    folder.classList.add('path');
    paths = [...paths, folder.id];
    folder = folder.parentElement!;
  }
  // Send client state
  F.postMessage({
    type: bx.CliMessageTypes.saveState,
    payload: {
      paths,
      open: foldersFolder.id,
    },
  });
}

function clearQuery() {
  const $query = $<HTMLInputElement>('.query');
  $query.value = '';
  $query.setAttribute('value', '');
  $query.focus();
  $('.form-query [type="submit"]').click();
}

// eslint-disable-next-line no-unused-vars
function setMouseEventListener(mouseMoveHandler: (e: MouseEvent) => any) {
  const mouseMoveHandlerWrapper = (e: MouseEvent) => {
    e.preventDefault();
    mouseMoveHandler(e);
  };
  document.addEventListener('mousemove', mouseMoveHandlerWrapper, false);
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', mouseMoveHandlerWrapper);
    F.postMessage({
      type: bx.CliMessageTypes.saveOptions,
      payload: {
        width: document.body.offsetWidth,
        height: document.body.offsetHeight,
        rightWidth: $('main > :last-child').offsetWidth,
      },
    });
  }, { once: true });
}

function resizeSplitHandler() {
  const target = $('main');
  return (e: MouseEvent) => {
    const width = Number(document.body.dataset.rightPane) - e.x;
    target.style.gridTemplateColumns = `min-content 1fr min-content ${width}px`;
  };
}

function resizeWidthHandler(e: MouseEvent) {
  const width = Number(document.body.dataset.startX) - e.screenX;
  document.body.style.width = `${width}px`;
}

function resizeHeightHandler(e: MouseEvent) {
  const height = Number(document.body.dataset.startY) + e.screenY;
  document.body.style.height = `${height}px`;
}

function setAnimationClass(el: HTMLElement, className: string) {
  el.classList.remove(className);
  // eslint-disable-next-line no-void
  void el.offsetWidth;
  el.classList.add(className);
}

function setAnimationFolder(el: HTMLElement, className: string) {
  el.addEventListener('animationend', () => el.classList.remove(className), { once: true });
  el.classList.add(className);
}

function setEventListners() {
  document.body.addEventListener('click', (e) => {
    const $target = e.target as HTMLElement;
    if ($target.classList.contains('leaf-menu-button')) {
      const $menu = $('.leaf-menu');
      $menu.style.top = '';
      $menu.style.left = '';
      $menu.style.right = '';
      if ($target.parentElement !== $menu.parentElement) {
        $target.parentElement?.insertBefore($menu, null);
      }
      if ($target.parentElement!.parentElement!.classList.contains('folders')) {
        const { width, height } = $menu.getBoundingClientRect();
        const rect = $target.getBoundingClientRect();
        $menu.style.left = `${rect.left - width + rect.width}px`;
        if ((rect.top + rect.height + height) >= ($('.folders').offsetHeight - 4)) {
          $menu.style.top = `${rect.top - height}px`;
        } else {
          $menu.style.top = `${rect.top + rect.height}px`;
        }
        return;
      }
      const [, marginRight] = /(\d+)px/.exec(getComputedStyle($target).marginRight) || [];
      $menu.style.right = `${Number(marginRight) + 1}px`;
      $target.classList.remove('menu-pos-top');
      const { top, height } = $menu.getBoundingClientRect();
      $target.classList.toggle('menu-pos-top', (top + height) >= ($('.leafs').offsetHeight - 4));
    }
  });

  const $scrollContainers = $$('.leafs, .folders');
  // eslint-disable-next-line no-undef
  let timerScrollbar: NodeJS.Timeout;
  F.setEvents($$('.scrollbar-area'), {
    mouseenter: (e) => {
      function endScrolling(e2: MouseEvent) {
        if (!(e2.relatedTarget as HTMLElement)?.classList.contains('scrollbar-area')) {
          clearTimeout(timerScrollbar);
          $scrollContainers.forEach(($target) => {
            $target.classList.remove('scrolling');
            $target.removeEventListener('mouseover', endScrolling);
            $target.removeEventListener('mouseleave', endScrolling);
          });
        }
      }
      F.setEvents($scrollContainers, {
        mouseover: endScrolling,
        mouseleave: endScrolling,
      });
      const $target = (e.currentTarget as HTMLElement)!.previousElementSibling! as HTMLElement;
      clearTimeout(timerScrollbar);
      timerScrollbar = setTimeout(() => $target.classList.add('scrolling'), 100);
    },
  });

  F.setEvents($$('.leaf-menu'), {
    click: async (e) => {
      const $leaf = (e.target as HTMLElement).parentElement!.previousElementSibling!.parentElement!;
      const $anchor = $leaf!.firstElementChild as HTMLAnchorElement;
      switch ((e.target as HTMLElement).dataset.value) {
        case 'open-new-window':
          openBookmark($anchor, bx.OpenBookmarkType.window);
          break;
        case 'open-incognito':
          openBookmark($anchor, bx.OpenBookmarkType.incognito);
          break;
        case 'edit-title': {
          const title = $anchor.textContent;
          // eslint-disable-next-line no-alert
          const value = prompt('Edit title', title!);
          if (value == null) {
            break;
          }
          const ret = await F.postMessage({
            type: bx.CliMessageTypes.editBookmark,
            payload: {
              value,
              editType: bx.EditBookmarkType.title,
              id: $leaf!.id,
            },
          });
          $anchor.setAttribute('title', ret.title);
          $anchor.textContent = value;
          setAnimationClass($leaf, 'hilite');
          break;
        }
        case 'edit-url': {
          const url = await F.postMessage({ type: bx.CliMessageTypes.getUrl, payload: $leaf!.id });
          // eslint-disable-next-line no-alert
          const value = prompt('Edit url', url!);
          if (value == null) {
            break;
          }
          const { title, style } = await F.postMessage({
            type: bx.CliMessageTypes.editBookmark,
            payload: {
              value,
              editType: bx.EditBookmarkType.url,
              id: $leaf!.id,
            },
          });
          $anchor.setAttribute('title', title);
          $anchor.setAttribute('style', style);
          setAnimationClass($leaf, 'hilite');
          break;
        }
        case 'remove': {
          const succeed = await F.postMessage({
            type: bx.CliMessageTypes.removeBookmark,
            payload: $leaf!.id,
          });
          if (succeed) {
            document.body.appendChild($('.leaf-menu'));
            $leaf.addEventListener('animationend', () => $leaf.remove(), { once: true });
            $leaf.classList.remove('hilite');
            setAnimationClass($leaf, 'remove-hilite');
          }
          break;
        }
        case 'show-in-folder': {
          const id = $leaf.parentElement?.id;
          const $target = $(`.folders ${F.cssid(id!)} > .marker > .title`);
          $target.click();
          $target.focus();
          ($leaf.firstElementChild as HTMLAnchorElement).focus();
          setAnimationClass($leaf, 'hilite');
          break;
        }
        default:
      }
      ($anchor.nextElementSibling as HTMLElement).blur();
    },
    mousedown: (e) => e.preventDefault(),
  });

  $('.folders').addEventListener('click', (e) => {
    const target = e.target as HTMLDivElement;
    if (target.classList.contains('title')) {
      clearQuery();
      const foldersFolder = target.parentElement?.parentElement!;
      const folders = [foldersFolder, $(`.leafs ${F.cssid(foldersFolder.id)}`)];
      const isOpen = foldersFolder.classList.contains('open');
      if (isOpen) {
        folders.forEach((el) => el.classList.add('path'));
        return false;
      }
      $$('.open').forEach((el) => el.classList.remove('open'));
      folders.forEach((el) => el.classList.add('open'));
      sendStateOpenedPath(foldersFolder);
      $$('.hilite').map((el) => el.classList.remove('hilite'));
    } else if (target.localName === 'a') {
      openBookmark(e.target!);
    } else if (target.classList.contains('fa-angle-right')) {
      onClickAngle(e);
    } else if (target.classList.contains('folder')) {
      $$('.open').forEach((el) => el.classList.remove('open'));
    } else if (target.classList.contains('marker')) {
      $('.title', target).click();
    } else if (target.classList.contains('button-wrapper')) {
      e.stopImmediatePropagation();
    } else if (target.classList.contains('folder-menu-button')) {
      const $menu = $('.folder-menu');
      $menu.style.top = '';
      $menu.style.left = '';
      if (target.parentElement !== $menu.parentElement) {
        target.parentElement?.insertBefore($menu, null);
      }
      const rect = target.getBoundingClientRect();
      const { width, height } = $menu.getBoundingClientRect();
      $menu.style.left = `${rect.left - width + rect.width}px`;
      if ((rect.top + rect.height + height) >= (document.body.offsetHeight + 4)) {
        $menu.style.top = `${rect.top - height}px`;
      } else {
        $menu.style.top = `${rect.top + rect.height}px`;
      }
    }
    return false;
  });

  $('.leafs').addEventListener('click', (e) => {
    const target = e.target as HTMLDivElement;
    if (target.localName === 'a') {
      openBookmark(e.target!);
    } else if ([...target.classList].find((className) => ['title', 'fa-angle-right'].includes(className))) {
      const folder = target.parentElement?.parentElement!;
      folder.classList.toggle('path');
    }
  });

  $('.form-query').addEventListener('submit', (e) => {
    e.preventDefault();
    const target = $<HTMLInputElement>('.query');
    const value = target.value.trim();
    target.setAttribute('value', value);
    const re = new RegExp(value, 'i');
    $('.leafs .open')?.classList.remove('open');
    $$('.leafs .search-path').forEach((el) => el.classList.remove('search-path'));
    $$('.leafs .path').forEach((el) => el.classList.remove('path'));
    if (value === '') {
      const openFolder = $('.folders .open');
      if (openFolder) {
        openFolder.classList.remove('open');
        $(':scope > .marker > .title', openFolder)?.click();
      }
      return false;
    }
    $$('.leafs .leaf')
      .filter((leaf) => re.test(leaf.firstElementChild?.textContent!))
      .map((el) => {
        el.classList.add('search-path');
        return el;
      })
      .forEach((el) => {
        let folder = el.parentElement;
        while (folder?.classList.contains('folder')) {
          folder.classList.add('search-path', 'path');
          folder = folder.parentElement;
        }
      });
    return false;
  });

  $('.query').addEventListener('input', () => $('.form-query [type="submit"]').click());
  $('.form-query .fa-times').addEventListener('click', clearQuery);

  $('.split-h').addEventListener('mousedown', (e) => {
    document.body.dataset.rightPane = String($('main > :last-child').offsetWidth + e.x);
    setMouseEventListener(resizeSplitHandler());
  });

  $('.resize-x').addEventListener('mousedown', (e) => {
    document.body.dataset.startX = String($('body').offsetWidth + e.screenX);
    setMouseEventListener(resizeWidthHandler);
  });

  $('.resize-y').addEventListener('mousedown', (e) => {
    document.body.dataset.startY = String($('body').offsetHeight - e.screenY);
    setMouseEventListener(resizeHeightHandler);
  });

  F.setEvents($$('.main-menu'), {
    click: async (e) => {
      switch ((e.target as HTMLElement).dataset.value) {
        case 'add-bookmark': {
          const { id, html, exists } = await F.postMessage({
            type: bx.CliMessageTypes.addBookmark,
            payload: '1',
          });
          if (exists) {
            // eslint-disable-next-line no-alert
            alert('This bookmark already exists in this folder.');
            break;
          }
          const $targetFolder = $(`.folders ${F.cssid(2)}`);
          $targetFolder.insertAdjacentHTML('beforebegin', html);
          const $target = $(`.leafs ${F.cssid(id)}`) || $(`.folders ${F.cssid(id)}`);
          ($target.firstElementChild as HTMLAnchorElement).focus();
          setAnimationClass($target, 'hilite');
          break;
        }
        default:
      }
    },
    mousedown: (e) => e.preventDefault(),
  });

  F.setEvents($$('.folder-menu'), {
    click: async (e) => {
      const $folder = F.getParentElement(e.target as HTMLElement, 4)!;
      switch ((e.target as HTMLElement).dataset.value) {
        case 'add-bookmark': {
          const { id, html, exists } = await F.postMessage({
            type: bx.CliMessageTypes.addBookmark,
            payload: $folder.id || '1',
          });
          if (exists) {
            // eslint-disable-next-line no-alert
            alert('This bookmark already exists in this folder.');
            break;
          }
          $('.title', $folder).click();
          const $targetFolder = $(`.leafs ${F.cssid($folder.id)}`) || $(`.folders ${F.cssid($folder.id)}`);
          $targetFolder.insertAdjacentHTML('beforeend', html);
          const $target = $(`.leafs ${F.cssid(id)}`) || $(`.folders ${F.cssid(id)}`);
          ($target.firstElementChild as HTMLAnchorElement).focus();
          setAnimationClass($target, 'hilite');
          break;
        }
        case 'edit': {
          const $title = $('.title > span', $folder);
          // eslint-disable-next-line no-alert
          const title = prompt('Edit folder name', $title.textContent as string);
          if (title == null) {
            break;
          }
          const succeed = await F.postMessage({
            type: bx.CliMessageTypes.editFolder,
            payload: {
              title,
              id: $folder.id,
            },
          });
          if (succeed) {
            $title.textContent = title;
            setAnimationFolder($title.parentElement!.parentElement!, 'hilite');
          }
          break;
        }
        case 'add-folder': {
          // eslint-disable-next-line no-alert
          const title = prompt('Create folder name');
          if (title == null) {
            break;
          }
          const { id, html, exists } = await F.postMessage({
            type: bx.CliMessageTypes.addFolder,
            payload: {
              title,
              parentId: $folder.id || '1',
            },
          });
          if (exists) {
            // eslint-disable-next-line no-alert
            alert('The same name folder already exists.');
            break;
          }
          $$(F.cssid($folder.id)).forEach(($targetFolder) => {
            $targetFolder.insertAdjacentHTML('beforeend', html);
          });
          const $target = $(`.folders ${F.cssid(id)} > .marker > .title`);
          $target.click();
          setAnimationFolder($target.parentElement!, 'hilite');
          $folder.dataset.children = String($folder.children.length - 1);
          break;
        }
        case 'remove': {
          const succeed = await F.postMessage({
            type: bx.CliMessageTypes.removeFolder,
            payload: $folder!.id,
          });
          if (succeed) {
            document.body.appendChild($('.folder-menu'));
            const $marker = $('.marker', $folder);
            $marker.addEventListener('animationend', () => {
              const $parent = $folder.parentElement!;
              $folder.remove();
              $parent.dataset.children = String($parent.children.length - 1);
              $('.title', $parent).click();
            }, { once: true });
            $marker.classList.remove('hilite');
            setAnimationFolder($marker, 'remove-hilite');
          }
          break;
        }
        default:
      }
    },
    mousedown: (e) => e.preventDefault(),
  });
}
