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
