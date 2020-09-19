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
    return `
      <span>
        <a href="#nul" title="${sUrl}" class="title2" style="background-image:url('chrome://favicon/${url}');">${content}</a>
      </span>
    `;
  }
}

export interface NodeProps {
  id: string;
  parentId?: number;
  content: string;
  indent: number;
}

export class BxNode extends HTMLDivElement implements NodeProps {
  parentId: number = 0;
  content: string = '';
  state: string = '';
  indent: number = 0;
  constructor(props: NodeProps) {
    super();
    Object.assign(this, props);
    this.className = `folder ${this.state}`;
    this.update();
  }
  update() {
    this.dataset.parentId = String(this.parentId);
    this.innerHTML = this.template();
  }
  template() {
    const padding = this.indent * 15 + 5;
    return `
      <div class="marker">
        <span class="expand-icon" style="margin-left:${padding}px"></span><span class="title" tabindex="2">${this.content}</span>
      </div>
    `;
  }
}
