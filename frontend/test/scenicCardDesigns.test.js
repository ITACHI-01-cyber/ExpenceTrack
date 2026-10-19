import assert from 'node:assert/strict';
import test from 'node:test';
import { getCardBackground, SCENIC_DESIGNS } from '../src/utils/cardDesigns.js';

test('scenic presets keep their existing IDs and names with image artwork', () => {
  assert.deepEqual(
    SCENIC_DESIGNS.map(({ id, name }) => [id, name]),
    [
      ['scenic-alpine', 'Alpine Sunset'],
      ['scenic-ocean', 'Ocean Horizon'],
      ['scenic-northern', 'Northern Lights'],
      ['scenic-sahara', 'Sahara Dunes'],
      ['scenic-tropical', 'Tropical'],
      ['scenic-neon-city', 'Neon City'],
      ['scenic-cherry', 'Cherry Blossom'],
      ['scenic-volcano', 'Volcanic Dawn']
    ]
  );
  assert.ok(SCENIC_DESIGNS.every(({ artworkUrl }) => artworkUrl.startsWith('https://')));
});

test('scenic backgrounds layer a readable overlay and gradient fallback over each image', () => {
  for (const design of SCENIC_DESIGNS) {
    const background = getCardBackground({ designPreset: design.id });
    assert.match(background.backgroundImage, /linear-gradient/);
    assert.match(background.backgroundImage, new RegExp(design.artworkUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(background.backgroundSize, 'cover');
  }
});

test('scenic presets do not overwrite saved artwork and non-scenic custom artwork remains supported', () => {
  const wallet = {
    designPreset: 'scenic-alpine',
    artwork: 'https://example.com/saved-artwork.jpg'
  };
  const scenicBackground = getCardBackground(wallet);
  assert.equal(wallet.artwork, 'https://example.com/saved-artwork.jpg');
  assert.ok(scenicBackground.backgroundImage.includes(SCENIC_DESIGNS[0].artworkUrl));

  const customBackground = getCardBackground({
    designPreset: 'midnight',
    artwork: 'https://example.com/saved-artwork.jpg'
  });
  assert.ok(customBackground.backgroundImage.includes('https://example.com/saved-artwork.jpg'));
});
