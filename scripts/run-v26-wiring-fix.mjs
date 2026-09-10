import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const sourcePath = 'scripts/apply-v26-wiring.mjs';
let source = await readFile(sourcePath, 'utf8');
const broken = 'return { ok: true, message: `SEQUENCE ${next.length}/${this.versions.rollbackAudit.commands.length} // ${next.join(" → ")}` };';
const fixed = 'return { ok: true, message: "SEQUENCE " + next.length + "/" + this.versions.rollbackAudit.commands.length + " // " + next.join(" → ") };';
if (!source.includes(broken)) throw new Error('Expected nested-template anchor not found in V26 wiring script');
source = source.replace(broken, fixed);
const tempPath = '/tmp/apply-v26-wiring-fixed.mjs';
await writeFile(tempPath, source);
await import(pathToFileURL(tempPath).href + `?t=${Date.now()}`);
