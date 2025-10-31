/**
 * enableZoomPan(svg)
 * ------------------
 * Basic wheel zoom + mouse drag panning for the SVG.
 * IMPORTANT: will NOT start panning while shift-selecting (state.isShiftSelecting)
 *
 * @param {SVGSVGElement} svg
 */
import { state } from '../core/state.js';

export function enableZoomPan(svg) {
  let viewBox = {
    x: 0,
    y: 0,
    w: svg.clientWidth,
    h: svg.clientHeight
  };
  let isPanning = false;
  let start = { x: 0, y: 0 };

  svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`);

  // Zoom with wheel
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    // use small steps for better control
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    const mx = e.clientX;
    const my = e.clientY;
    const rect = svg.getBoundingClientRect();
    const px = (mx - rect.left) / rect.width;
    const py = (my - rect.top) / rect.height;

    // Zoom centered on mouse position in viewBox coords
    const vb = svg.viewBox.baseVal;
    const cx = vb.x + vb.width * px;
    const cy = vb.y + vb.height * py;

    vb.width *= factor;
    vb.height *= factor;
    vb.x = cx - vb.width * px;
    vb.y = cy - vb.height * py;

    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
  }, { passive: false });

  // Start panning on mousedown only if not shift-selecting
  svg.addEventListener('mousedown', e => {
    // Don't start panning when user holds SHIFT (we use SHIFT for selection)
    if (e.shiftKey || state.isShiftSelecting) return;

    // Only pan when clicking on background (not on nodes/edges)
    if (e.target !== svg) return;

    isPanning = true;
    start = { x: e.clientX, y: e.clientY };
  });

  window.addEventListener('mouseup', () => (isPanning = false));

  window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    const vb = svg.viewBox.baseVal;
    const dx = (start.x - e.clientX) * (vb.width / svg.clientWidth);
    const dy = (start.y - e.clientY) * (vb.height / svg.clientHeight);
    vb.x += dx;
    vb.y += dy;
    svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
    start = { x: e.clientX, y: e.clientY };
  });
}
