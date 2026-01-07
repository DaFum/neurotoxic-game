import assert from 'node:assert';
import { test } from 'node:test';
import { CHARACTERS } from '../src/data/characters.js';
import { SONGS_DB } from '../src/data/songs.js';
import { UPGRADES_DB } from '../src/data/upgrades.js';
import { ALL_VENUES } from '../src/data/venues.js';
// Chatter might be a simple export
// import { CHATTER_DB } from '../src/data/chatter.js';
// Let's check chatter.js content first or just try importing default/named.

test('CHARACTERS data integrity', () => {
    assert.ok(CHARACTERS.MATZE);
    assert.ok(CHARACTERS.LARS);
    assert.ok(CHARACTERS.MARIUS);

    Object.values(CHARACTERS).forEach(char => {
        assert.equal(typeof char.name, 'string');
        assert.equal(typeof char.role, 'string');
        // Add more schema checks as needed
    });
});

test('SONGS_DB data integrity', () => {
    assert.ok(Array.isArray(SONGS_DB));
    SONGS_DB.forEach(song => {
        assert.equal(typeof song.id, 'string');
        assert.equal(typeof song.name, 'string');
        assert.equal(typeof song.bpm, 'number');
        assert.equal(typeof song.duration, 'number');
        assert.equal(typeof song.difficulty, 'number');
        assert.ok(song.energy, 'Song should have energy profile');
    });
});

test('UPGRADES_DB data integrity', () => {
    Object.values(UPGRADES_DB).forEach(category => {
        assert.ok(Array.isArray(category));
        category.forEach(upgrade => {
             assert.equal(typeof upgrade.id, 'string');
             assert.equal(typeof upgrade.name, 'string');
             assert.equal(typeof upgrade.cost, 'number');
             assert.ok(upgrade.effect, 'Upgrade should have effect');
        });
    });
});

test('ALL_VENUES data integrity', () => {
    assert.ok(Array.isArray(ALL_VENUES));
    ALL_VENUES.forEach(venue => {
        assert.equal(typeof venue.id, 'string');
        assert.equal(typeof venue.name, 'string');
        assert.equal(typeof venue.x, 'number');
        assert.equal(typeof venue.y, 'number');
    });
});
