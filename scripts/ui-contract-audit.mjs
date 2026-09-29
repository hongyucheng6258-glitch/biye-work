#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync, lstatSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const DEFAULT_REV = '91214e0';
const DEFAULT_FILE = 'docs/ui-redesign/ui-contract-baseline.json';
const sha256 = value => createHash('sha256').update(value).digest('hex');
// Git checkouts on Windows can use CRLF. Only CRLF is normalized; other bytes stay significant.
const canonical = bytes => bytes.includes(0) ? bytes : Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'));
const add = (bag, key) => { bag[key] = (bag[key] || 0) + 1; };
const stable = bag => Object.fromEntries(Object.entries(bag).sort(([a], [b]) => a.localeCompare(b)));
const attributes = source => [...source.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)]
  .map(match => [match[1], match[2] ?? match[3] ?? match[4] ?? null]);
const decorative = name => /^(?::|v-bind:)?(?:class|style)$/.test(name) || /^(?:title|aria-label|aria-description)$/.test(name);
const customOrInteractive = tag => tag.includes('-') || /^[A-Z]/.test(tag) || /^(?:slot|component|button|input|textarea|select|option|a|form|canvas|video|audio)$/.test(tag);

function inspectVue(bytes) {
  const source = canonical(bytes).toString('utf8');
  // This is a conservative source scanner, not a Vue compiler. Keep scripts BEFORE stripping comments.
  const scripts = [...source.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi)].map(match => sha256(match[0]));
  const template = source.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const nodes = Object.create(null);
  const interpolations = Object.create(null);
  for (const match of template.matchAll(/<([A-Za-z][\w:.-]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/g)) {
    const tag = match[1];
    const attrs = attributes(match[2]).filter(([name]) => !decorative(name));
    attrs.sort(([a, av], [b, bv]) => a.localeCompare(b) || String(av).localeCompare(String(bv)));
    if (attrs.length || customOrInteractive(tag)) add(nodes, JSON.stringify([tag, attrs]));
  }
  for (const match of template.matchAll(/{{([\s\S]*?)}}/g)) add(interpolations, match[1].trim());
  return { scripts, nodes: stable(nodes), interpolations: stable(interpolations) };
}

function compareVue(before, after) {
  const errors = [];
  const warnings = [];
  if (JSON.stringify(before.scripts) !== JSON.stringify(after.scripts)) errors.push('script blocks changed (including script attributes/order)');
  for (const section of ['nodes', 'interpolations']) {
    for (const [key, count] of Object.entries(before[section])) {
      if ((after[section][key] || 0) < count) errors.push(`${section} missing/changed: ${key} (expected ${count}, found ${after[section][key] || 0})`);
    }
    const added = Object.entries(after[section]).filter(([key, count]) => count > (before[section][key] || 0)).length;
    if (added) warnings.push(`${added} new ${section} contract(s): review visibility, permissions, and UI-only scope`);
  }
  return { errors, warnings };
}

function protectedFile(path) {
  if (/^(?:web\/backend\/|docker\/|tests\/)/.test(path)) return true;
  if (/^(?:docker-compose.*\.ya?ml|\.env(?:\..*)?|\.gitignore|\.gitattributes|\.dockerignore)$/.test(path)) return true;
  if (!/^web\/frontend\/(?:student|admin)\//.test(path) || path.endsWith('.vue')) return false;
  // Existing scripts, routing, stores, features, utilities and config remain frozen in full.
  if (/\/src\/(?:api|store|router|features|utils)\//.test(path)) return true;
  return !/\.(?:css|scss|sass|less|png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|otf)$/i.test(path);
}

function git(root, args, input) {
  const result = spawnSync('git', ['-C', root, ...args], { input, maxBuffer: 128 * 1024 * 1024, windowsHide: true });
  if (result.error || result.status !== 0) throw new Error(`git ${args[0]} failed; verify the checkout/revision (source contents suppressed)`);
  return result.stdout;
}

function capture(root, rev) {
  const revision = git(root, ['rev-parse', '--verify', `${rev}^{commit}`]).toString().trim();
  const entries = git(root, ['ls-tree', '-rz', '--full-tree', revision]).toString('utf8').split('\0').filter(Boolean)
    .map(line => { const [meta, path] = line.split('\t'); const [mode, type, oid] = meta.split(' '); return { mode, type, oid, path }; })
    .filter(entry => entry.path.endsWith('.vue') || protectedFile(entry.path));
  const data = git(root, ['cat-file', '--batch'], entries.map(entry => entry.oid).join('\n') + '\n');
  const files = Object.create(null);
  let offset = 0;
  for (const entry of entries) {
    if (entry.type !== 'blob' || entry.mode === '120000') throw new Error(`Unsupported baseline file type: ${entry.path}`);
    const newline = data.indexOf(10, offset);
    const size = Number(data.subarray(offset, newline).toString().split(' ')[2]);
    if (!Number.isSafeInteger(size)) throw new Error('Invalid git batch response');
    const bytes = data.subarray(newline + 1, newline + 1 + size);
    offset = newline + 1 + size + 1;
    files[entry.path] = entry.path.endsWith('.vue') ? { kind: 'vue', ...inspectVue(bytes) } : { kind: 'protected', sha256: sha256(canonical(bytes)) };
  }
  return { version: 1, revision, normalization: 'CRLF to LF for text; binary bytes unchanged', files };
}

function selfTest() {
  const before = '<template>\n<button @click="save" v-if="canEdit">{{ total }}</button><button @click="save" v-if="canEdit">Save</button></template>\n<script setup>\nconst total = 1\n</script>';
  const base = inspectVue(Buffer.from(before));
  assert.equal(base.nodes['["button",[["@click","save"],["v-if","canEdit"]]]'], 2);
  assert.equal(base.interpolations.total, 1);
  const scan = text => inspectVue(Buffer.from(text));
  const check = text => compareVue(base, scan(text));
  assert.deepEqual(scan(before.replace('button @click', 'button class="new" @click')), base);
  assert.equal(check(before.replace('<template>', '<template><div class="wrapper">').replace('</template>', '</div></template>')).errors.length, 0);
  assert.ok(check(before.replace('@click="save"', '@click="remove"')).errors.some(error => error.includes('found 1')));
  assert.ok(check(before.replace('<button @click="save" v-if="canEdit">Save</button>', '')).errors.some(error => error.includes('found 1')));
  assert.ok(check(before.replace('const total = 1', 'const total = 2')).errors.some(error => error.includes('script')));
  assert.ok(check(before.replace('{{ total }}', '{{ other }}')).errors.some(error => error.includes('interpolations')));
  assert.deepEqual(scan(before.replaceAll('\n', '\r\n')), base);
  assert.equal(Object.keys(scan('<template><!-- <button @click="save" /> --></template>').nodes).length, 0);
  assert.equal(Object.keys(scan('<template><el-input v-model="text" :disabled="n > 1" @keydown.enter.prevent="send" ref="input" /></template>').nodes).length, 1);
  assert.ok(Object.keys(scan('<template><input disabled required accept="image/*" /></template>').nodes)[0].includes('required'));
  assert.ok(check(before.replace('</template>', '<a href="/new">New</a></template>')).warnings.length);
  for (const path of ['web/backend/a.java', 'tests/a.cjs', 'docker/a', 'web/frontend/student/src/features/a.css', 'web/frontend/admin/src/utils/date.js', 'web/frontend/admin/package-lock.json', '.env.example']) assert.equal(protectedFile(path), true, path);
  for (const path of ['docs/ui-redesign/a.md', 'web/frontend/admin/src/App.vue', 'web/frontend/student/src/styles/base.css', 'web/frontend/admin/public/a.png']) assert.equal(protectedFile(path), false, path);
  console.log('PASS self-test: mutations, duplicates, wrappers, scripts, CRLF, comments, quoted >, directives, refs, static props, additions, protected scope');
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--self-test') return selfTest();
  const mode = args.shift();
  if (!['capture', 'check'].includes(mode)) throw new Error('Usage: node scripts/ui-contract-audit.mjs capture|check [--rev 91214e0] [--baseline path] [--root path] OR --self-test');
  const options = { '--rev': DEFAULT_REV, '--baseline': DEFAULT_FILE, '--root': process.cwd() };
  for (let i = 0; i < args.length; i += 2) {
    if (!(args[i] in options) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`Unknown/incomplete option: ${args[i]}`);
    options[args[i]] = args[i + 1];
  }
  const root = git(resolve(options['--root']), ['rev-parse', '--show-toplevel']).toString().trim();
  const file = resolve(root, options['--baseline']);
  // Always reconstruct trusted contracts from Git; editing the JSON cannot waive a failure.
  const baseline = capture(root, options['--rev']);
  if (mode === 'capture') {
    const serialized = JSON.stringify(baseline, null, 2) + '\n';
    if (existsSync(file) && readFileSync(file, 'utf8').replaceAll('\r\n', '\n') !== serialized) throw new Error('Baseline exists with different contents; choose a new --baseline path and review, do not silently refresh');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, serialized);
    console.log(`CAPTURE ${baseline.revision}: ${Object.keys(baseline.files).length} files -> ${file}`);
    return;
  }
  if (!existsSync(file)) throw new Error('Baseline file missing; run capture against the approved revision first');
  const stored = JSON.parse(readFileSync(file, 'utf8'));
  if (JSON.stringify(stored) !== JSON.stringify(baseline)) throw new Error('Baseline JSON does not match approved Git revision; check cancelled');
  const errors = [];
  const warnings = [];
  for (const [path, contract] of Object.entries(baseline.files)) {
    const absolute = resolve(root, path);
    if (!existsSync(absolute) || !lstatSync(absolute).isFile()) { errors.push(`${path}: missing or not a regular file`); continue; }
    const bytes = readFileSync(absolute);
    if (contract.kind === 'protected') {
      if (sha256(canonical(bytes)) !== contract.sha256) errors.push(`${path}: protected file changed (content suppressed)`);
    } else {
      const result = compareVue(contract, inspectVue(bytes));
      errors.push(...result.errors.map(error => `${path}: ${error}`));
      warnings.push(...result.warnings.map(warning => `${path}: ${warning}`));
    }
  }
  const current = git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).toString('utf8').split('\0').filter(Boolean);
  for (const path of new Set(current)) {
    if (path in baseline.files) continue;
    if (protectedFile(path)) errors.push(`${path}: new file in protected business/config/test scope`);
    if (path.endsWith('.vue')) warnings.push(`${path}: new Vue file; manually audit scripts, imports, props, emits, effects, and visibility`);
  }
  for (const warning of warnings) console.warn(`WARN ${warning}`);
  for (const error of errors) console.error(`ERROR ${error}`);
  const counts = Object.values(baseline.files).reduce((out, value) => { out[value.kind]++; return out; }, { protected: 0, vue: 0 });
  console.log(`${errors.length ? 'FAIL' : 'PASS'} contract audit: ${counts.protected} protected files, ${counts.vue} Vue files; ${errors.length} error(s), ${warnings.length} warning(s). Baseline ${baseline.revision}. Manual E2E still required.`);
  process.exitCode = errors.length ? 1 : 0;
}

try { main(); } catch (error) { console.error(`ERROR ${error.message}`); process.exitCode = 1; }
