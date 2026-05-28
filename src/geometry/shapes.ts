import { Path, Shape } from "three";

export function rectangleShape(width: number, depth: number): Shape {
  const shape = new Shape();
  shape.moveTo(0, 0);
  shape.lineTo(width, 0);
  shape.lineTo(width, depth);
  shape.lineTo(0, depth);
  shape.lineTo(0, 0);
  return shape;
}

export function roundedRectanglePath(x: number, y: number, width: number, depth: number, radius: number): Path {
  const r = Math.min(radius, width / 2, depth / 2);
  const path = new Path();

  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.absarc(x + width - r, y + r, r, -Math.PI / 2, 0, false);
  path.lineTo(x + width, y + depth - r);
  path.absarc(x + width - r, y + depth - r, r, 0, Math.PI / 2, false);
  path.lineTo(x + r, y + depth);
  path.absarc(x + r, y + depth - r, r, Math.PI / 2, Math.PI, false);
  path.lineTo(x, y + r);
  path.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  path.closePath();

  return path;
}

export function circlePath(x: number, y: number, radius: number): Path {
  const path = new Path();
  path.absellipse(x, y, radius, radius, 0, Math.PI * 2, false, 0);
  path.closePath();
  return path;
}
