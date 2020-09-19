import { $ } from './utils';

export interface BookmarkElmentProps {
  id: string,
  content?: string;
  url?: string;
  iconClass: string;
  sUrl: string;
}

export class BxLeaf extends HTMLDivElement implements BookmarkElmentProps {
  // props
  content: string = '';
  iconClass: string = '';
  url: string = '';
  sUrl: string = '';
  // child elements
  link!: HTMLAnchorElement;
  icon!: HTMLElement;
  constructor(props: BookmarkElmentProps) {
    super();
    Object.assign(this, props);
    this.className = 'leaf';
    const tmplBookmarkElement = $('.leaf', $<HTMLTemplateElement>('template').content);
    const bookmarkElement = tmplBookmarkElement.firstElementChild!.cloneNode(true);
    this.attachShadow({ mode: 'open' }).append(bookmarkElement);
    this.link = $<HTMLAnchorElement>('a', this.shadowRoot!);
    this.icon = $<HTMLElement>('i', this.shadowRoot!);
    this.update();
  }
  update() {
    this.link.textContent = this.content;
    this.link.title = this.sUrl;
    this.link.style.backgroundImage = `url('chrome://favicon/${this.url}')`;
    this.icon.className = this.iconClass;
  }
}
