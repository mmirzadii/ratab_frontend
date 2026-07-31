export type MenuPoint = { x: number; y: number };

export type MenuSize = { width: number; height: number };

/**
 * Clamp a context-menu top-left position so the menu stays inside the viewport.
 * Prefers the requested point; flips when space is insufficient.
 */
export function clampMenuPosition(
  point: MenuPoint,
  size: MenuSize,
  viewport: { width: number; height: number } = {
    width: typeof window !== "undefined" ? window.innerWidth : 1024,
    height: typeof window !== "undefined" ? window.innerHeight : 768
  },
  margin = 8
): MenuPoint {
  const maxX = Math.max(margin, viewport.width - size.width - margin);
  const maxY = Math.max(margin, viewport.height - size.height - margin);

  let x = point.x;
  let y = point.y;

  if (x + size.width + margin > viewport.width) {
    x = point.x - size.width;
  }
  if (y + size.height + margin > viewport.height) {
    y = point.y - size.height;
  }

  return {
    x: Math.min(Math.max(margin, x), maxX),
    y: Math.min(Math.max(margin, y), maxY)
  };
}

export function messageHasAnyAction(message: {
  can_edit: boolean;
  can_delete: boolean;
  can_forward: boolean;
}): boolean {
  return Boolean(message.can_edit || message.can_delete || message.can_forward);
}
