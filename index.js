// @ts-check

import { getViewPos, modelToView, toMatrix, viewToModel, solveMultiple, solveSingle, debouncedAnimationFrame, solve } from './pan-zoom.js';

class PanZoom extends HTMLElement {
  constructor() {
    super();

    const pointers = new Map();
    this._transform = {
      x: 0,
      y: 0,
      s: 1
    };

    const shadowRoot = this.attachShadow({ mode: 'open' });

    this.style.touchAction = 'none';

    shadowRoot.innerHTML = `
      <style>
        #wrapper {
          touch-action: none;
          overflow: hidden;
        }
        
        #transformer {
          transform-origin: top left;
        }
      </style>
      <div id="wrapper">
        <div id="transformer">
          <slot></slot>
        </div>
      </div>
    `;

    this._transformerDiv = shadowRoot.querySelector('#transformer');

    const requestSingleAnimationFrame = debouncedAnimationFrame(() => {
      this.transform = solve(this.transform, ...pointers.values());
    });

    this.addEventListener('pointerdown', e => {
      const viewPos = getViewPos(e);
      const modelPos = viewToModel(viewPos, this.transform);
      pointers.set(e.pointerId, { modelPos, viewPos });

      this.setPointerCapture(e.pointerId);
    }, false);

    this.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;

      const viewPos = getViewPos(e);
      const pointer = pointers.get(e.pointerId);
      pointer.viewPos = viewPos;

      requestSingleAnimationFrame();
    }, false);

    this.addEventListener('pointerup', e => {
      if (!pointers.has(e.pointerId)) return;

      pointers.delete(e.pointerId);
    }, false);

    this.addEventListener('wheel', e => {
      const viewPos = getViewPos(e);
      const modelPos = viewToModel(viewPos, this.transform);
      this.transform = solveSingle(viewPos, modelPos, this.transform.s * (1 + e.deltaY / 100));

      e.preventDefault();
      e.stopPropagation();
    }, { passive: false });

    this.addEventListener('dblclick', e => {
      const viewPos = getViewPos(e);
      const modelPos = viewToModel(viewPos, this.transform);
      this.transform = solveSingle(viewPos, modelPos, this.transform.s * (1.3));

      e.preventDefault();
      e.stopPropagation();
    }, false);
  }

  get transform() {
    return this._transform;
  }

  set transform({ x, y, s }) {
    this._transform.x = x;
    this._transform.y = y;
    this._transform.s = s;
    this._transformerDiv.style.transform = toMatrix(this._transform);
  }
}

customElements.define("pan-zoom", PanZoom);
