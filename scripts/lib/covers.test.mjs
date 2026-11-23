// node scripts/lib/covers.test.mjs — sans réseau
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { extractImageUrl, toDataUrl } from './covers.mjs';

assert.equal(extractImageUrl('<meta property="og:image" content="/img/a.jpg?x=1&amp;y=2">', 'https://shop.fr/p/1'), 'https://shop.fr/img/a.jpg?x=1&y=2');
assert.equal(extractImageUrl('<meta content="https://c.dn/b.png" property="og:image" />', 'https://shop.fr'), 'https://c.dn/b.png');
assert.equal(extractImageUrl('<meta name="twitter:image" content="https://c.dn/t.jpg">', 'https://x'), 'https://c.dn/t.jpg');
assert.equal(extractImageUrl('<html></html>', 'https://x'), null);

const big = await sharp({ create: { width: 2000, height: 1500, channels: 3, background: '#3355aa' } }).png().toBuffer();
const url = await toDataUrl(big);
assert.match(url, /^data:image\/jpeg;base64,/);
const meta = await sharp(Buffer.from(url.split(',')[1], 'base64')).metadata();
assert.equal(meta.width, 600);
assert.equal(meta.height, 600, 'carré');
assert.ok(url.length * 0.75 < 180_000);
console.log('covers.test OK');
