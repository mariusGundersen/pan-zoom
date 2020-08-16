class PanZoom extends HTMLElement {
  constructor() {
    super();

    let requestedAnimationFrame = false;
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

    const onAnimationFrame = () => {
      requestedAnimationFrame = false;
      const positions = [...pointers.values()];
      if (positions.length === 1) {
        const { viewPos, modelPos } = positions[0];

        this.transform = solveSingle(viewPos, modelPos, this.transform.s);
      } else {
        this.transform = solveMultiple(positions);

        pointers.forEach(p => {
          p.modelPos = viewToModel(p.viewPos, this.transform);
        });
      }
    };

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

      if (!requestedAnimationFrame) {
        requestedAnimationFrame = true;
        requestAnimationFrame(onAnimationFrame);
      }
    }, false);

    this.addEventListener('pointerup', e => {
      if (!pointers.has(e.pointerId)) return;

      pointers.delete(e.pointerId);

      console.log('pointerup', pointers);
    }, false);

    this.addEventListener('wheel', e => {
      const viewPos = getViewPos(e);
      const modelPos = viewToModel(viewPos, this.transform);
      this.transform = solveSingle(viewPos, modelPos, this.transform.s * (1 + e.deltaY / 100));

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

function getViewPos(event) {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: event.clientX - rect.x,
    y: event.clientY - rect.y
  };
}

function modelToView(viewPos, transform) {
  return {
    x: transform.s * viewPos.x + transform.x,
    y: transform.s * viewPos.y + transform.y
  };
}

function viewToModel(viewPos, transform) {
  return {
    x: (viewPos.x - transform.x) / transform.s,
    y: (viewPos.y - transform.y) / transform.s
  };
}

function solveSingle(viewPos, modelPos, s) {
  return {
    x: viewPos.x - modelPos.x * s,
    y: viewPos.y - modelPos.y * s,
    s
  };
}

function solveMultiple(positions) {
  const len = positions.length;
  let m00 = 0, m01 = 0, m02 = 0;
  let v0 = 0, v1 = 0, v2 = 0;
  for (const { viewPos, modelPos } of positions) {
    m00 += modelPos.x ** 2 + modelPos.y ** 2;
    m01 += modelPos.x;
    m02 += modelPos.y;
    v0 += viewPos.x * modelPos.x + viewPos.y * modelPos.y;
    v1 += viewPos.x;
    v2 += viewPos.y;
  }
  const ata = [
    m00, m01, m02,
    m01, len, 0,
    m02, 0, len
  ];
  const det = m00 * len ** 2 - len * m01 ** 2 - len * m02 ** 2;
  const inv00 = len ** 2;
  const inv01 = -len * m01;
  const inv02 = -len * m02;
  const inv12 = m01 * m02;
  const inv11 = len * m00 - m02 ** 2;
  const inv22 = len * m00 - m01 ** 2;
  const atb = [
    v0,
    v1,
    v2
  ];
  return {
    x: (inv00 * v0 + inv01 * v1 + inv02 * v2) / det,
    y: (inv01 * v0 + inv11 * v1 + inv12 * v2) / det,
    z: (inv02 * v0 + inv12 * v1 + inv22 * v2) / det
  };
}

function toMatrix({ x, y, s }) {
  return `matrix(${s}, 0, 0, ${s}, ${x}, ${y})`;
}

function requestSingleAnimationFrame(func) {
  let requested = false;
  return () => {
    if (!requested) {
      requested = true;
      requestAnimationFrame(() => {
        requested = false;
        func();
      });
    }
  }
}