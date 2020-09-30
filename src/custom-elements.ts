/* eslint-disable max-classes-per-file */

export interface LeafProps {
  id: string;
  parentId?: number;
  content: string;
  url?: string;
  sUrl: string;
}

export class BxLeaf extends HTMLDivElement implements LeafProps {
  parentId: number = 0;
  content: string = '';
  url: string = '';
  sUrl: string = '';
  constructor(props: LeafProps) {
    super();
    Object.assign(this, props);
    this.className = 'leaf';
    this.update();
  }
  update() {
    this.dataset.parentId = String(this.parentId);
    this.innerHTML = this.template();
  }
  template() {
    const { content, url, sUrl } = this;
    return `<a href="#nul" title="${sUrl}" style="background-image:url('chrome://favicon/${url}');">${content}</a>`;
  }
}

export interface NodeProps {
  id: string;
  parentId?: number;
  content: string;
  // eslint-disable-next-line no-use-before-define
  nodes?: BookmarkElements;
}

export class BxNode extends HTMLDivElement implements NodeProps {
  parentId: number = 0;
  content: string = '';
  state: string = '';
  // eslint-disable-next-line no-use-before-define
  nodes: BookmarkElements = [];
  constructor(props: NodeProps) {
    super();
    Object.assign(this, props);
    this.className = `folder ${this.state}`;
    this.update();
  }
  update() {
    this.dataset.parentId = String(this.parentId);
    this.innerHTML = this.template();
    this.append(...this.nodes);
  }
  template() {
    return `
      <div class="marker">
        <i class="gl gl-angle-right"></i>
        <div class="title" tabindex="2">${this.content}</div>
      </div>
    `;
  }
}

export type BookmarkElements = Array<BxLeaf | BxNode>;
