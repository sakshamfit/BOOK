import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const preview = join(root, 'orion-preview');
const postcss = createRequire(import.meta.resolve('@tailwindcss/postcss'))('postcss');
let pages, css, ast, script, temporary;
before(async () => {
  pages = await Promise.all((await readdir(preview)).filter(name => name.endsWith('.html')).map(async name => ({ name, source: await readFile(join(preview, name), 'utf8') })));
  css = await readFile(join(preview, 'site-experience.css'), 'utf8');
  script = await readFile(join(preview, 'site-experience.js'), 'utf8');
  ast = postcss.parse(css);
  temporary = await mkdtemp(join(tmpdir(), 'orion-site-experience-'));
});
after(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); });

function declarations(selector, property, media) {
  const values = [];
  ast.walkRules(rule => {
    if (!rule.selectors.includes(selector)) return;
    let ancestor = rule.parent;
    const conditions = [];
    while (ancestor) { if (ancestor.type === 'atrule' && ancestor.name === 'media') conditions.push(ancestor.params); ancestor = ancestor.parent; }
    if (media && !conditions.some(condition => condition.includes(media))) return;
    rule.walkDecls(property, decl => values.push(decl.value));
  });
  return values;
}

test('all Orion pages share one versioned, deferred enhancement layer without disabling zoom', () => {
  assert.ok(pages.length >= 40);
  const cssVersions = new Set(), jsVersions = new Set();
  for (const {name, source} of pages) {
    assert.equal((source.match(/href="site-experience\.css\?v=\d+"/g) ?? []).length, 1, name);
    assert.equal((source.match(/src="site-experience\.js\?v=\d+" defer/g) ?? []).length, 1, name);
    cssVersions.add(source.match(/site-experience\.css\?v=(\d+)/)[1]);
    jsVersions.add(source.match(/site-experience\.js\?v=(\d+)/)[1]);
    assert.match(source, /name="viewport" content="width=device-width,initial-scale=1"/, name);
    assert.doesNotMatch(source, /user-scalable\s*=\s*no|maximum-scale\s*=\s*1/, name);
    assert.ok(source.indexOf('site-experience.css') > source.indexOf('href="style.css'), name);
    assert.ok(source.indexOf('site-experience.js') > source.indexOf('src="script.js'), name);
  }
  assert.equal(cssVersions.size, 1); assert.deepEqual(cssVersions, jsVersions);
});

test('shared styles fix narrow heading/grid overflow rather than hiding the page edges', () => {
  assert.ok(declarations('.sub-heading', 'flex-direction', 'max-width: 650px').includes('column'));
  assert.ok(declarations('.sub-grid', 'grid-template-columns', 'max-width: 650px').includes('minmax(0, 1fr)'));
  assert.ok(declarations('.sub-heading h2', 'max-width', 'max-width: 650px').includes('100%'));
  assert.ok(declarations('.orion-footer-columns', 'grid-template-columns', 'max-width: 480px').includes('repeat(2, minmax(0, 1fr))'));
  assert.ok(declarations('.movie-stats', 'grid-template-columns', 'max-width: 480px').includes('1fr'));
  ast.walkDecls('overflow-x', decl => assert.notEqual(decl.value, 'hidden'));
  assert.doesNotMatch(css, /\[data-garment\]|\[data-stage\]/); // Never widen the ten clothing hit targets.
});

test('mobile navigation has matching tablet breakpoints and progressive no-JS navigation', () => {
  assert.match(script, /matchMedia\('\(max-width: 1024px\)'\)/);
  assert.ok(declarations('.nav-ready .menu-toggle', 'display', 'max-width: 1024px').includes('flex'));
  assert.ok(declarations('html:not(.nav-ready) .header nav', 'display').includes('grid'));
  assert.ok(declarations('html:not(.nav-ready) .menu-toggle', 'display').includes('none'));
  assert.match(script, /nav\.inert = compactNavigation\.matches && !open/);
  assert.match(script, /event\.key === 'Escape'/);
  assert.match(script, /inertBefore\.forEach/); // Restore pre-existing inert state, don't blindly clear it.
  assert.ok(declarations('html.is-menu-open', 'overflow').includes('hidden'));
  assert.equal(declarations('html', 'scroll-padding-top').length, 0); // Prevent sticky-header focus scroll jumps.
  assert.match(css, /max-height: calc\(100dvh - var\(--site-nav-offset, var\(--site-header-height\)\)\)/);
  assert.match(script, /header\.getBoundingClientRect\(\)\.bottom/); // Account for the announcement above the header in short landscape.
  assert.match(script, /nav\.scrollTop = 0/);
});

test('scroll reveals are opt-in, motion-aware, and do not hide content when enhancement is unavailable', () => {
  const hidden = [];
  ast.walkRules(rule => {
    if (!rule.selector.includes('data-site-reveal')) return;
    rule.walkDecls('opacity', decl => {
      if (decl.value !== '0') return;
      hidden.push(rule.selector);
      assert.match(rule.selector, /html\.site-motion/);
      let ancestor = rule.parent, gated = false;
      while (ancestor) { if (ancestor.type === 'atrule' && ancestor.params.includes('prefers-reduced-motion: no-preference')) gated = true; ancestor = ancestor.parent; }
      assert.equal(gated, true);
    });
  });
  assert.equal(hidden.length, 1);
  assert.ok(declarations('html [data-site-reveal]', 'opacity', 'prefers-reduced-motion: reduce').includes('1'));
  assert.match(script, /if \(!\('IntersectionObserver' in window\)\) return/);
  assert.match(script, /reducedMotion\.addEventListener\('change', sync\)/);
  assert.match(script, /node\.removeAttribute\('data-site-reveal'\)/); // Hover transitions must not retain entrance delays.
  assert.match(script, /\[data-orion-rail\].*#clothing-rail-root.*#brand-wheel-root/);
});

test('shared scripts are valid standalone JavaScript with no animation runtime dependency', async () => {
  for (const name of ['site-experience.js', 'script.js']) {
    const result = spawnSync(process.execPath, ['--check', join(preview, name)], {encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
  }
  assert.ok(Buffer.byteLength(script) < 16_000);
  assert.ok(Buffer.byteLength(css) < 20_000);
  assert.doesNotMatch(script, /^import |require\(|gsap|requestAnimationFrame\(update\).*requestAnimationFrame\(update\)/m);
  assert.match(script, /addEventListener\('scroll', schedule, \{ passive: true \}\)/);
  const legacy = await readFile(join(preview, 'script.js'), 'utf8');
  assert.doesNotMatch(legacy, /function setMenu|classList\.add\('reveal'\)/); // No second, competing nav/reveal controller.
  assert.match(legacy, /intersecting && !document\.hidden/);
});

test('the hero video has explicit pause control and skips mobile, reduced-motion and data-saving visitors', () => {
  assert.match(script, /wide\.matches && !reducedMotion\.matches && !connection\?\.saveData/);
  assert.match(script, /Play background video.*Pause background video/);
  assert.match(script, /iframe\.remove\(\); iframe = null/);
  assert.match(script, /focus\(\{ preventScroll: true \}\)/);
});

test('regenerated category pages retain the responsive/motion layer and the complete clothing rail', async () => {
  const generated = join(temporary, 'generated'); await mkdir(generated);
  const source = await readFile(join(preview, 'create-pages.py'), 'utf8');
  const result = spawnSync('python3', ['-c', `import sys\n${source.replace('root=Path(__file__).parent', 'root=Path(sys.argv[1])')}`, generated], {encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const names = (await readdir(generated)).filter(name => name.endsWith('.html'));
  assert.ok(names.length > 10);
  for (const name of names) {
    const html = await readFile(join(generated, name), 'utf8');
    assert.match(html, /site-experience\.css\?v=1/);
    assert.match(html, /site-experience\.js\?v=1" defer/);
  }
  const clothing = await readFile(join(generated, 'clothing.html'), 'utf8');
  assert.match(clothing, /clothing-rail-root/); assert.match(clothing, /clothing-stores/);
});

test('new WordPress-imported pages receive the same shared assets without losing sanitized content', async () => {
  const generated = join(temporary, 'imported'); await mkdir(generated);
  await writeFile(join(generated, 'events.html'), '<html><head></head><body><main></main></body></html>');
  const xml = join(temporary, 'export.xml');
  await writeFile(xml, `<?xml version="1.0"?><rss xmlns:wp="http://wordpress.org/export/1.2/" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><item><title>Test Orion story</title><link>https://orionmallgorakhpur.com/test-story/</link><wp:post_type>post</wp:post_type><wp:status>publish</wp:status><wp:post_id>99999</wp:post_id><content:encoded><![CDATA[<p>Original exported copy.</p><script>alert('unsafe')</script>]]></content:encoded></item></channel></rss>`);
  const source = await readFile(join(preview, 'import-wordpress.py'), 'utf8');
  const result = spawnSync('python3', ['-c', source.replace('root=Path(__file__).resolve().parent', 'root=Path(sys.argv[2])'), xml, generated], {encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const html = await readFile(join(generated, 'post-99999.html'), 'utf8');
  assert.match(html, /site-experience\.css\?v=1/); assert.match(html, /site-experience\.js\?v=1" defer/);
  assert.match(html, /Original exported copy\./); assert.doesNotMatch(html, /alert\('unsafe'\)/);
});
