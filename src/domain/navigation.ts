export function isNavigationActive(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
