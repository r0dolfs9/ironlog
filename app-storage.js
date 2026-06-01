(function(root){
  'use strict';

  const DEFAULT_PROFILE = 'default';
  const DEFAULT_KEY = 'il4__default';
  const LEGACY_KEY = 'il4';

  function dbKey(profileId){
    const id = String(profileId || DEFAULT_PROFILE).trim() || DEFAULT_PROFILE;
    return `il4__${id}`;
  }

  function serializeBackup(db){
    return JSON.stringify(db, null, 2);
  }

  function parseBackup(text){
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (_) {
      throw new Error('Backup import failed: invalid JSON');
    }
    if(!parsed || typeof parsed !== 'object')throw new Error('Backup import failed: expected an object');
    if(!parsed.exercises)throw new Error('Backup import failed: missing exercises');
    if(!Array.isArray(parsed.workouts))throw new Error('Backup import failed: missing workouts');
    return parsed;
  }

  function readStoredDB(storage, key, legacyKey){
    const activeKey = key || DEFAULT_KEY;
    const legacy = legacyKey || LEGACY_KEY;
    const raw = storage.getItem(activeKey);
    if(raw)return { db: JSON.parse(raw), migrated: false };
    const old = storage.getItem(legacy);
    if(!old)return { db: null, migrated: false };
    storage.setItem(activeKey, old);
    return { db: JSON.parse(old), migrated: true };
  }

  function writeStoredDB(storage, key, db){
    storage.setItem(key || DEFAULT_KEY, serializeBackup(db));
  }

  function backupFilename(date){
    return `ironlog-${date}.json`;
  }

  const api = { dbKey, serializeBackup, parseBackup, readStoredDB, writeStoredDB, backupFilename };
  root.IronLogStorage = api;
  if(typeof module !== 'undefined' && module.exports)module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
