/** Keep the middle copy in view, with two copies available on either side. */
export function wrapClientOffset(position: number, setWidth: number): number {
  if (setWidth <= 0) return position;
  return -2 * setWidth - ((-position % setWidth) + setWidth) % setWidth;
}
