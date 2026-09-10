export class ContentDB {
  async loadJson<T>(url: string): Promise<T> {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Content load failed for ${url}: ${response.status}`);
    return await response.json() as T;
  }
}
