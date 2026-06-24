const CDN_BASE = import.meta.env.VITE_PUBLIC_ASSETS_URL as string | undefined;

export function assetUrl(path: string): string {
  if (!CDN_BASE) return path;
  return `${CDN_BASE}/${path.replace(/^\//, "")}`;
}
