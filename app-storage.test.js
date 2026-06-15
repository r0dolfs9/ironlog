const assert = require('assert');

const storage = require('./app-storage.js');

function memoryStorage(seed = {}) {
  const data = { ...seed };
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
    dump() {
      return { ...data };
    }
  };
}

assert.strictEqual(storage.dbKey(), 'il4__default');
assert.strictEqual(storage.dbKey('athlete'), 'il4__athlete');
assert.strictEqual(storage.dbKey(''), 'il4__default');

const legacyPayload = JSON.stringify({ exercises: { chest: [] }, workouts: [{ id: 'w1' }] });
const store = memoryStorage({ il4: legacyPayload });
assert.deepStrictEqual(storage.readStoredDB(store, storage.dbKey()), {
  db: { exercises: { chest: [] }, workouts: [{ id: 'w1' }] },
  migrated: true
});
assert.strictEqual(store.getItem('il4__default'), legacyPayload);

const activeProfilePayload = JSON.stringify({ exercises: { back: [] }, workouts: [{ id: 'active-profile' }] });
const activeProfileStore = memoryStorage({
  il4_active: 'athlete1',
  il4_profiles: JSON.stringify([{ id: 'athlete1', name: 'Main' }]),
  il4_athlete1: activeProfilePayload
});
assert.deepStrictEqual(storage.readStoredDB(activeProfileStore, storage.dbKey()), {
  db: { exercises: { back: [] }, workouts: [{ id: 'active-profile' }] },
  migrated: true
});
assert.strictEqual(activeProfileStore.getItem('il4__default'), activeProfilePayload);
assert.strictEqual(activeProfileStore.getItem('il4_athlete1'), activeProfilePayload);

const profileListPayload = JSON.stringify({ exercises: { legs: [] }, workouts: [{ id: 'profile-list' }] });
const profileListStore = memoryStorage({
  il4_profiles: JSON.stringify([{ id: 'solo', name: 'Solo' }]),
  il4_solo: profileListPayload
});
assert.deepStrictEqual(storage.readStoredDB(profileListStore, storage.dbKey()), {
  db: { exercises: { legs: [] }, workouts: [{ id: 'profile-list' }] },
  migrated: true
});
assert.strictEqual(profileListStore.getItem('il4__default'), profileListPayload);

assert.deepStrictEqual(storage.readStoredDB(memoryStorage(), storage.dbKey()), {
  db: null,
  migrated: false
});

const backup = storage.serializeBackup({ workouts: [{ id: 'w2' }] });
assert.strictEqual(backup, '{\n  "workouts": [\n    {\n      "id": "w2"\n    }\n  ]\n}');
assert.deepStrictEqual(storage.parseBackup('{"exercises":{},"workouts":[]}'), { exercises: {}, workouts: [] });
assert.throws(() => storage.parseBackup('{"workouts":[]}'), /missing exercises/);
assert.throws(() => storage.parseBackup('bad json'), /invalid JSON/);

assert.strictEqual(storage.backupFilename('2026-06-01'), 'ironlog-2026-06-01.json');

console.log('app-storage tests passed');
