// 生成 PWA 所需的 PNG 图标
// 运行: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

const iconSvg = readFileSync(resolve(publicDir, 'icon.svg'));
const maskableSvg = readFileSync(resolve(publicDir, 'maskable.svg'));

const targets = [
  { input: iconSvg, size: 192, name: 'pwa-192x192.png' },
  { input: iconSvg, size: 512, name: 'pwa-512x512.png' },
  { input: iconSvg, size: 180, name: 'apple-touch-icon.png' },
  { input: maskableSvg, size: 512, name: 'maskable-512x512.png' },
  { input: iconSvg, size: 32, name: 'favicon-32x32.png' },
  { input: iconSvg, size: 16, name: 'favicon-16x16.png' },
];

for (const t of targets) {
  await sharp(t.input)
    .resize(t.size, t.size)
    .png()
    .toFile(resolve(publicDir, t.name));
  console.log(`✓ generated ${t.name} (${t.size}×${t.size})`);
}

// 同时生成 ICO 兼容用 (其实 favicon.svg 已足够，跳过)
console.log('Done.');
