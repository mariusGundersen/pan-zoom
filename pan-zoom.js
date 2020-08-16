// @ts-check

/**
 * @typedef {{clientX: number, clientY: number, currentTarget: HTMLElement}} PointerEvent
 * @typedef {{x: number, y: number}} Pos
 * @typedef {{x: number, y: number, s: number}} Transform
 * @typedef {{modelPos: Pos, viewPos: Pos}} PosPos
 */

/**
 * 
 * @param {PointerEvent} event
 * @returns {Pos}
 */
export function getViewPos(event) {
  const rect = event.currentTarget.getBoundingClientRect();

  return {
    x: event.clientX - rect.x,
    y: event.clientY - rect.y
  };
}

/**
 * 
 * @param {Pos} modelPos 
 * @param {Transform} transform 
 * @returns {Pos}
 */
export function modelToView(modelPos, transform) {
  return {
    x: transform.s * modelPos.x + transform.x,
    y: transform.s * modelPos.y + transform.y
  };
}

/**
 * 
 * @param {Pos} viewPos 
 * @param {Transform} transform 
 * @returns {Pos}
 */
export function viewToModel(viewPos, transform) {
  return {
    x: (viewPos.x - transform.x) / transform.s,
    y: (viewPos.y - transform.y) / transform.s
  };
}

/**
 * 
 * @param {Transform} transform 
 * @param {PosPos[]} positions 
 * @returns {Transform}
 */
export function solve(transform, ...positions) {
  if (positions.length === 1) {
    const { viewPos, modelPos } = positions[0];

    return solveSingle(viewPos, modelPos, transform.s);
  } else if (positions.length > 1) {
    transform = solveMultiple(positions);

    for (const position of positions) {
      position.modelPos = viewToModel(position.viewPos, transform);
    }

    return transform;
  } else {
    return transform;
  }
}

/**
 * 
 * @param {Pos} viewPos
 * @param {Pos} modelPos 
 * @param {number} s 
 * @returns {Transform}
 */
export function solveSingle(viewPos, modelPos, s) {
  return {
    x: viewPos.x - modelPos.x * s,
    y: viewPos.y - modelPos.y * s,
    s
  };
}

/**
 * 
 * @param {PosPos[]} positions 
 * @returns {Transform}
 */
export function solveMultiple(positions) {

  // ax = b
  // ata x = atb
  // ata^-1 ata x = ata^-1 atb
  // x = ata^-1 atb

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

  //       [m00  m01  m02]
  // ata = [m01  len    0]
  //       [m02    0  len]
  //
  //       [v0]
  // atb = [v1]
  //       [v2]

  const det = m00 * len ** 2 - len * m01 ** 2 - len * m02 ** 2;
  const inv00 = len ** 2;
  const inv01 = -len * m01;
  const inv02 = -len * m02;
  const inv12 = m01 * m02;
  const inv11 = len * m00 - m02 ** 2;
  const inv22 = len * m00 - m01 ** 2;

  //            1   [inv00  inv01  inv02]
  // ata^-1 = ----- [inv01  inv11  inv12]
  //           det  [inv02  inv12  inv22]

  return {
    s: (inv00 * v0 + inv01 * v1 + inv02 * v2) / det,
    x: (inv01 * v0 + inv11 * v1 + inv12 * v2) / det,
    y: (inv02 * v0 + inv12 * v1 + inv22 * v2) / det
  };
}

/**
 * 
 * @param {Transform} transform
 * @returns {string} 
 */
export function toMatrix({ x, y, s }) {
  return `matrix(${s}, 0, 0, ${s}, ${x}, ${y})`;
}

/**
 * 
 * @param {() => void} func 
 * @returns {() => void}
 */
export function debouncedAnimationFrame(func) {
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
