/**
 * Minimal IndexedDB wrapper for caching precomputed bundles.
 * - store name: 'narrative_cache_v1'
 * - object stores: 'bundles' (key: string -> value JSON), 'meta' (key -> {lastAccess, size})
 * - simple LRU eviction based on maxEntries
 */
const DB_NAME = 'narrative_cache_v1';
const DB_VERSION = 1;
const STORE_BUNDLES = 'bundles';
const STORE_META = 'meta';
const MAX_ENTRIES = 30;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_BUNDLES)) db.createObjectStore(STORE_BUNDLES);
      if (!db.objectStoreNames.contains(STORE_META)) db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result as IDBDatabase);
    req.onerror = () => reject(req.error);
  });
}

async function getRaw(key: string): Promise<any | null> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_BUNDLES, STORE_META], 'readwrite');
    const b = tx.objectStore(STORE_BUNDLES).get(key as IDBValidKey);
    b.onsuccess = () => {
      const val = b.result;
      // update meta lastAccess
      try {
        tx.objectStore(STORE_META).put({ lastAccess: Date.now() }, key as IDBValidKey);
      } catch {
        // ignore
      }
      resolve(val || null);
    };
    b.onerror = () => resolve(null);
  });
}

async function putRaw(key: string, value: any): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve) => {
    const tx = db.transaction([STORE_BUNDLES, STORE_META], 'readwrite');
    try {
      tx.objectStore(STORE_BUNDLES).put(value, key as IDBValidKey);
      tx.objectStore(STORE_META).put({ lastAccess: Date.now() }, key as IDBValidKey);
    } catch {
      // ignore
    }
    tx.oncomplete = async () => {
      try {
        await enforceLimit(db);
      } catch {
        // ignore
      }
      resolve(true);
    };
    tx.onerror = () => resolve(false);
  });
}

function iterateMeta(db: IDBDatabase): Promise<Array<{ key: string; val: { lastAccess?: number } }>> {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_META, 'readonly');
    const cur = tx.objectStore(STORE_META).openCursor();
    const items: Array<{ key: string; val: { lastAccess?: number } }> = [];
    cur.onsuccess = () => {
      const c = cur.result as IDBCursorWithValue | null;
      if (!c) {
        resolve(items);
        return;
      }
      items.push({ key: String(c.key), val: c.value });
      c.continue();
    };
    cur.onerror = () => resolve(items);
  });
}

async function enforceLimit(db: IDBDatabase) {
  try {
    const items = await iterateMeta(db);
    if (items.length <= MAX_ENTRIES) return;
    items.sort((a, b) => (a.val.lastAccess || 0) - (b.val.lastAccess || 0));
    const toRemove = items.slice(0, items.length - MAX_ENTRIES).map((i) => i.key);
    const tx = db.transaction([STORE_BUNDLES, STORE_META], 'readwrite');
    for (const k of toRemove) {
      try {
        tx.objectStore(STORE_BUNDLES).delete(k as IDBValidKey);
        tx.objectStore(STORE_META).delete(k as IDBValidKey);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

export default {
  async get(key: string) {
    try {
      return await getRaw(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: any) {
    try {
      return await putRaw(key, value);
    } catch {
      return false;
    }
  },
  async keys(): Promise<string[]> {
    try {
      const db = await openDb();
      const items = await iterateMeta(db);
      return items.map((i) => i.key);
    } catch {
      return [];
    }
  },
  async del(key: string) {
    try {
      const db = await openDb();
      const tx = db.transaction([STORE_BUNDLES, STORE_META], 'readwrite');
      tx.objectStore(STORE_BUNDLES).delete(key as IDBValidKey);
      tx.objectStore(STORE_META).delete(key as IDBValidKey);
      return true;
    } catch {
      return false;
    }
  },
};
