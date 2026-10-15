/* Run from the 904degrees.com website root: node tools/validate-showroom.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'showroom/catalog/designs.json'), 'utf8'));
const problems = [];
const ids = new Set();
const numbers = new Set();
const tags = new Set(data.tagGroups.flatMap(group => group.tags));
for (const design of data.designs) {
  if (!/^[a-z][a-z0-9-]+$/.test(design.id)) problems.push(`Invalid design ID ${design.id}`);
  if (ids.has(design.id)) problems.push(`Duplicate design ID ${design.id}`);
  ids.add(design.id);
  if (!Number.isInteger(design.number) || design.number < 1 || numbers.has(design.number)) problems.push(`Duplicate/invalid number ${design.number}`);
  numbers.add(design.number);
  if (!Array.isArray(design.tags) || !design.tags.length) problems.push(`${design.id}: missing tags`);
  for (const tag of design.tags || []) if (!tags.has(tag)) problems.push(`${design.id}: unrecognized tag ${tag}`);
  if (design.tags.includes('Shopping Cart') && design.tags.includes('No Cart')) problems.push(`${design.id}: contradictory commerce tags`);
  for (const key of ['detailPath', 'demoPath']) {
    const value = design[key];
    if (typeof value !== 'string' || !/^\/showroom\/[a-z0-9/\-]+\/$/.test(value)) {
      problems.push(`${design.id}: unsafe ${key}`); continue;
    }
    const file = path.join(root, value.slice(1), 'index.html');
    if (!fs.existsSync(file)) problems.push(`${design.id}: ${key} does not exist (${value})`);
  }
}
if (fs.existsSync(path.join(root, 'demo'))) problems.push('Root /demo directory must not exist');
if (problems.length) {
  console.error('MARK10 showroom catalog validation FAILED:\n' + problems.map(p => ' - ' + p).join('\n'));
  process.exitCode = 1;
} else console.log(`MARK10 catalog validated: ${data.designs.length} design(s), ${data.designs.filter(d => d.published).length} published, ${tags.size} known tags.`);
