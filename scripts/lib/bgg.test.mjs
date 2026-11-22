// node scripts/lib/bgg.test.mjs — test du parsing sans réseau
import assert from 'node:assert/strict';
import { XMLParser } from 'fast-xml-parser';
import { parseThing, toGamePatch } from './bgg.mjs';

const xml = `<?xml version="1.0" encoding="utf-8"?><items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
<item type="boardgame" id="9209">
  <thumbnail>https://cf.geekdo-images.com/thumb.jpg</thumbnail>
  <image>https://cf.geekdo-images.com/full.jpg</image>
  <name type="primary" sortindex="1" value="Ticket to Ride" />
  <name type="alternate" sortindex="1" value="Les Aventuriers du Rail" />
  <yearpublished value="2004" /><minplayers value="2" /><maxplayers value="5" />
  <playingtime value="60" /><minage value="8" />
  <link type="boardgamecategory" id="1034" value="Trains" />
  <link type="boardgameexpansion" id="21348" value="Ticket to Ride: 1910" />
  <link type="boardgameexpansion" id="99999" value="Base inbound" inbound="true" />
  <statistics page="1"><ratings><usersrated value="90000" /><average value="7.37" /><averageweight value="1.83" /></ratings></statistics>
</item></items>`;

const p = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', isArray: (n) => ['item', 'name', 'link'].includes(n) });
const d = parseThing(p.parse(xml).items.item[0]);
assert.equal(d.bggId, 9209);
assert.equal(d.name, 'Ticket to Ride');
assert.deepEqual(d.altNames, ['Ticket to Ride', 'Les Aventuriers du Rail']);
assert.equal(d.minAge, 8);
assert.equal(d.complexity, 2);
assert.equal(d.rating, 7.4);
assert.deepEqual(d.expansions, [{ bggId: 21348, name: 'Ticket to Ride: 1910' }]);

const patch = toGamePatch({ name: 'Les Aventuriers du Rail', playersMin: 3, playersMax: 0, durationMin: 0 }, d);
assert.equal(patch.playersMin, undefined, 'ne pas écraser une saisie');
assert.equal(patch.playersMax, 5);
assert.equal(patch.ageMin, 8);
assert.equal(patch.coverUrl, 'https://cf.geekdo-images.com/full.jpg');
console.log('bgg.test OK');
