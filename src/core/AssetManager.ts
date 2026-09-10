export type AssetStatus = "final" | "reference" | "placeholder";

export interface AssetManifestEntry {
  id: string;
  src: string;
  kind: string;
  status: AssetStatus;
  role: string;
  fallback?: string;
}

interface AssetManifest {
  schema_version: number;
  assets: AssetManifestEntry[];
}

export class AssetManager {
  private readonly assets = new Map<string, AssetManifestEntry>();

  async load(url = "../assets/v2/asset-manifest.json"): Promise<void> {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Asset manifest load failed: ${response.status}`);
    const manifest = await response.json() as AssetManifest;
    for (const entry of manifest.assets) {
      if (this.assets.has(entry.id)) throw new Error(`Duplicate asset id '${entry.id}'.`);
      this.assets.set(entry.id, entry);
    }
  }

  get(id: string): AssetManifestEntry | null {
    return this.assets.get(id) ?? null;
  }

  resolve(id: string): string | null {
    return this.get(id)?.src ?? null;
  }
}
