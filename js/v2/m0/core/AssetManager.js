export class AssetManager {
    assets = new Map();
    async load(url = "../assets/v2/asset-manifest.json") {
        const response = await fetch(url, { cache: "no-cache" });
        if (!response.ok)
            throw new Error(`Asset manifest load failed: ${response.status}`);
        const manifest = await response.json();
        for (const entry of manifest.assets) {
            if (this.assets.has(entry.id))
                throw new Error(`Duplicate asset id '${entry.id}'.`);
            this.assets.set(entry.id, entry);
        }
    }
    get(id) {
        return this.assets.get(id) ?? null;
    }
    resolve(id) {
        const entry = this.get(id);
        if (!entry)
            return null;
        return entry.src;
    }
}
