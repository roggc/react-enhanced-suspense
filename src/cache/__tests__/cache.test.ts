import cacheAPI, {
  setCache,
  getCache,
  deleteCache,
  CustomCacheStorage,
} from "../cache.js";
import sizeof from "object-sizeof";

jest.mock("object-sizeof", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue(200), // Siempre devuelve 200 bytes
}));

// Mock Date.now for consistent TTL testing
const mockDateNow = jest.spyOn(Date, "now");
let currentTime = 1000000;

beforeEach(() => {
  currentTime = 1000000;
  mockDateNow.mockReturnValue(currentTime);
  cacheAPI.setCustomStorage(null);
  cacheAPI.clearCache();
  cacheAPI.setCustomStorage(null);
  cacheAPI.setCacheSizeLimit(null, null);
  localStorage.clear();
});

afterEach(() => {
  jest.clearAllMocks();
  cacheAPI.stopAutomaticCacheCleanup();
});

afterAll(() => {
  mockDateNow.mockRestore();
  cacheAPI.setCustomStorage(null);
  cacheAPI.clearCache();
  cacheAPI.setCustomStorage(null);
  cacheAPI.setCacheSizeLimit(null, null);
  localStorage.clear();
});

describe("Memory Cache", () => {
  test("setCache and getCache work without TTL", () => {
    setCache("key1", "value1");
    expect(getCache("key1")?.value).toBe("value1");
  });

  test("setCache with TTL expires correctly", () => {
    setCache("key1", "value1", 1000);
    expect(getCache("key1")?.value).toBe("value1");
    mockDateNow.mockReturnValue(currentTime + 1001);
    expect(getCache("key1")).toBe(null);
  });

  test("deleteCache removes entry", () => {
    setCache("key1", "value1");
    deleteCache("key1");
    expect(getCache("key1")).toBe(null);
  });

  test("persist option stores in localStorage", () => {
    setCache("key1", "value1", undefined, true);
    expect(localStorage.getItem("enhanced_suspense_cache_key1")).toBe(
      JSON.stringify({ value: "value1", expiry: undefined })
    );
    expect(getCache("key1")?.value).toBe("value1");
  });
});

describe("Cache Size Limits", () => {
  test("MAX_CACHE_BYTES evicts oldest entries", () => {
    cacheAPI.setCacheSizeLimit(400); // Small limit
    setCache("key1", "value1"); // ~200 bytes
    setCache("key2", "value2"); // ~200 bytes
    setCache("key3", "value3"); // Exceeds limit
    expect(getCache("key1")).toBe(null); // Oldest evicted
    expect(getCache("key2")?.value).toBe("value2");
    expect(getCache("key3")?.value).toBe("value3");
  });

  test("MAX_CACHE_ENTRIES limits entries", () => {
    cacheAPI.setCacheSizeLimit(null, 2);
    setCache("key1", "value1");
    setCache("key2", "value2");
    setCache("key3", "value3");
    expect(getCache("key1")).toBe(null);
    expect(getCache("key2")?.value).toBe("value2");
    expect(getCache("key3")?.value).toBe("value3");
  });
});

describe("Custom Storage", () => {
  const customStorage: CustomCacheStorage = {
    get: jest.fn((key) => (key === "key1" ? { value: "customValue" } : null)),
    set: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
  };

  test("setCustomStorage works", () => {
    cacheAPI.setCustomStorage(customStorage);
    setCache("key1", "value1");
    expect(customStorage.set).toHaveBeenCalledWith(
      "key1",
      "value1",
      undefined,
      false
    );
    expect(getCache("key1")?.value).toBe("customValue");
  });

  test("getFromCustomStorage handles expired entries", () => {
    cacheAPI.setCustomStorage(customStorage);
    setCache("key1", "value1", 1000);
    mockDateNow.mockReturnValue(currentTime + 1001);
    expect(getCache("key1")?.value).toBeUndefined();
    expect(customStorage.delete).toHaveBeenCalledWith("key1");
    expect(customStorage.get).toHaveBeenCalledTimes(1);
  });
});

describe("Cache Status", () => {
  test("getCacheStatus reports memory cache", () => {
    setCache("key1", "value1");
    setCache("key2", "value2", 1000);
    setCache("key3", "value3", undefined, true);
    const status = cacheAPI.getCacheStatus();
    expect(status).toEqual({
      isCustomStorage: false,
      entryCount: 3,
      persistentCount: 1,
      expirationCount: 1,
      isCleanupActive: false,
    });
  });

  test("getCacheStatus with custom storage", () => {
    const customStorage: CustomCacheStorage = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      status: jest.fn(() => ({
        entryCount: 5,
        persistentCount: 2,
        expirationCount: 3,
      })),
    };
    cacheAPI.setCustomStorage(customStorage);
    const status = cacheAPI.getCacheStatus();
    expect(status).toEqual({
      isCustomStorage: true,
      entryCount: 5,
      persistentCount: 2,
      expirationCount: 3,
      isCleanupActive: false,
    });
  });
});

describe("Cleanup", () => {
  test("cleanupCache removes expired entries", () => {
    setCache("key1", "value1", 1000);
    setCache("key2", "value2");
    mockDateNow.mockReturnValue(currentTime + 1001);
    cacheAPI.cleanupCache();
    expect(getCache("key1")).toBe(null);
    expect(getCache("key2")?.value).toBe("value2");
  });

  test("startAutomaticCacheCleanup works", () => {
    jest.useFakeTimers();
    try {
      setCache("key1", "value1", 1000);
      cacheAPI.startAutomaticCacheCleanup(100);
      jest.advanceTimersByTime(1100); // Advance past TTL (1000ms)
      mockDateNow.mockReturnValue(currentTime + 1100); // Sync with timers
      expect(getCache("key1")).toBe(null);
      cacheAPI.stopAutomaticCacheCleanup();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("Edge Cases", () => {
  test("invalid key is ignored", () => {
    setCache("", "value1");
    expect(getCache("")?.value).toBeUndefined();
    setCache(" ", "value1");
    expect(getCache(" ")?.value).toBeUndefined();
  });

  test("localStorage error logs warning", () => {
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    setCache("key1", "value1", undefined, true);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('LocalStorage operation "setStringified" failed')
    );
    consoleWarnSpy.mockRestore();
    setItemSpy.mockRestore();
  });
});
