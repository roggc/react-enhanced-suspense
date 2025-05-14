import { renderHook, act } from "@testing-library/react";
import { usePromise } from "../use-promise";
import * as cache from "../../cache/cache";
import { StrictMode } from "react";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const resource = jest.fn(
  () => new Promise((resolve) => setTimeout(() => resolve("data"), 100))
);
const INITIAL_NUMBER_OF_CALLS = 1;

describe("usePromise Hook", () => {
  afterAll(() => cache.default.clearCache());

  // Tests para retry
  describe("retry option", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
    });

    afterEach(() => {
      // cache.default.clearCache(); // Clear cache after each test
      jest.useRealTimers();
      jest.resetAllMocks();
    });

    test("retries the specified number of times and succeeds on the last attempt", async () => {
      let callCount = 0;
      const resource = jest.fn(() => {
        callCount++;
        if (callCount < 3) {
          return new Promise((resolve, reject) =>
            setTimeout(() => reject("Failed"), 100)
          );
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve("Success"), 100)
        );
      });

      const { result } = await act(() =>
        renderHook(() => usePromise(resource, true, 2, 1000, "linear"))
      );

      const promise = result.current[0];
      expect(resource).toHaveBeenCalledTimes(1);
      expect(result.current[1]).toBe(0); // attempt

      await act(async () => {
        await delay(1120); // Primer retraso
      });

      expect(resource).toHaveBeenCalledTimes(2);

      // Intento 2: falla
      expect(result.current[1]).toBe(1);
      expect(promise).toBe(result.current[0]);

      await act(async () => {
        await delay(2120);
      });

      expect(resource).toHaveBeenCalledTimes(3);
      // Intento 3: éxito
      expect(result.current[1]).toBe(2);
      expect(promise).toBe(result.current[0]);
      await expect(promise).resolves.toBe("Success");
    });

    test("retries the specified number of times and succeeds on the last attempt with inline resource", async () => {
      const getResource = () => {
        let callCount = 0;
        const resource = () => {
          callCount++;
          if (callCount < 3) {
            return new Promise((resolve, reject) =>
              setTimeout(() => reject("Failed"), 100)
            );
          }
          return new Promise((resolve) =>
            setTimeout(() => resolve("Success"), 100)
          );
        };
        return resource;
      };

      const { result } = await act(() =>
        renderHook(() => usePromise(getResource(), true, 2, 1000, "linear"))
      );

      const promise = result.current[0];
      expect(result.current[1]).toBe(0); // attempt

      await act(async () => {
        await delay(1120); // Primer retraso
      });

      // Intento 2: falla
      expect(result.current[1]).toBe(1);
      expect(promise).toBe(result.current[0]);

      await act(async () => {
        await delay(2120);
      });

      // Intento 3: éxito
      expect(result.current[1]).toBe(2);
      expect(promise).toBe(result.current[0]);
      await expect(promise).resolves.toBe("Success");
    });

    test("retries with exponential backoff and fails after max attempts", async () => {
      // const resource = jest.fn(() => Promise.reject("Failed"));
      const resource = jest.fn(
        () =>
          new Promise((resolve, reject) =>
            setTimeout(() => reject("Failed"), 100)
          )
      );

      const { result } = renderHook(() =>
        usePromise(resource, true, 2, 1000, "exponential")
      );

      const promise = result.current[0];

      // await act(() => {
      //   promise.catch(() => {
      //     console.log("catched");
      //   });
      // });

      expect(resource).toHaveBeenCalledTimes(1);
      expect(result.current[1]).toBe(0);

      await act(async () => {
        await delay(1120);
      });

      expect(resource).toHaveBeenCalledTimes(2);
      expect(result.current[1]).toBe(1);
      expect(result.current[0]).toBe(promise);

      await act(async () => {
        await delay(2110);
      });

      expect(resource).toHaveBeenCalledTimes(3);
      expect(result.current[1]).toBe(2);
      expect(result.current[0]).toBe(promise);

      await expect(promise).rejects.toBe("Failed");
    });

    test("uses custom backoff function for retries", async () => {
      const resource = jest.fn(
        () =>
          new Promise((resolve, reject) =>
            setTimeout(() => reject("Failed"), 100)
          )
      );
      const customBackoff = jest.fn((attempt: number) => 500 * (attempt + 1));

      const { result } = renderHook(() =>
        usePromise(resource, true, 2, 500, customBackoff)
      );

      const promise = result.current[0];
      // Intento 0: falla
      expect(result.current[1]).toBe(0);
      expect(resource).toHaveBeenCalledTimes(1);
      await act(async () => {
        await delay(620); // 500 * (0 + 1)
      });
      // Intento 1: falla
      expect(resource).toHaveBeenCalledTimes(2);
      expect(result.current[1]).toBe(1);
      expect(promise).toBe(result.current[0]);
      expect(customBackoff).toHaveBeenCalledWith(0, 500);
      await act(async () => {
        await delay(1110); // 500 * (1 + 1)
      });
      // Intento 2: falla
      expect(resource).toHaveBeenCalledTimes(3);
      expect(result.current[1]).toBe(2);
      expect(promise).toBe(result.current[0]);
      expect(customBackoff).toHaveBeenCalledWith(1, 500);
      await expect(promise).rejects.toBe("Failed");
    });

    test("cancells pending retries on unmount", async () => {
      const resource = jest.fn(
        () =>
          new Promise((_, reject) => setTimeout(() => reject("Failed"), 1000))
      );
      const { result, unmount } = renderHook(() =>
        usePromise(resource, true, 2, undefined, undefined)
      );

      expect(resource).toHaveBeenCalledTimes(1);
      // Intento 1: falla
      expect(result.current[1]).toBe(0);
      await act(async () => {
        await delay(100);
      });

      // Desmontar para cancelar
      await act(async () => {
        unmount();
      });

      // No se realizan más intentos
      await act(async () => {
        await delay(3000);
      });
      expect(resource).toHaveBeenCalledTimes(1);
    });

    test("retries without delay", async () => {
      let callCount = 0;
      const resource = jest.fn(() => {
        callCount++;
        if (callCount < 2) {
          return new Promise((resolve, reject) =>
            setTimeout(() => reject("Failed"), 100)
          );
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve("Success"), 100)
        );
      });

      const { result } = renderHook(() => usePromise(resource, true, 1, 0));
      const promise = result.current[0];
      expect(result.current[1]).toBe(0);
      await act(async () => {
        await delay(110);
      });
      expect(result.current[1]).toBe(1);

      await expect(promise).resolves.toBe("Success");
    });

    test("don't retry if promise is success", async () => {
      const resource = jest.fn(
        () =>
          new Promise((resolve) => setTimeout(() => resolve("Success"), 100))
      );
      const { result } = renderHook(() => usePromise(resource, true, 2));
      const promise = result.current[0];
      expect(resource).toHaveBeenCalledTimes(1);
      // Intento 1: Success
      expect(result.current[1]).toBe(0);
      await expect(promise).resolves.toBe("Success");
      expect(resource).toHaveBeenCalledTimes(1);
    });
  });

  describe("retry with cache option", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
    });

    afterEach(() => {
      // cache.default.clearCache(); // Clear cache after each test
      jest.useRealTimers();
      jest.resetAllMocks();
    });

    test("retries and caches the result on success", async () => {
      let callCount = 0;
      const resource = jest.fn(() => {
        callCount++;
        if (callCount < 2) {
          return new Promise((resolve, reject) =>
            setTimeout(() => reject("Failed"), 100)
          );
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve("Success"), 100)
        );
      });

      const { result, rerender } = renderHook(() =>
        usePromise(
          resource,
          true,
          1,
          undefined,
          undefined,
          true,
          10000,
          undefined,
          undefined,
          "key7"
        )
      );

      const promise = result.current[0];
      expect(resource).toHaveBeenCalledTimes(1);
      // Intento 1: falla
      expect(result.current[1]).toBe(0);
      await act(async () => {
        await delay(110);
      });

      // Intento 2: éxito
      expect(resource).toHaveBeenCalledTimes(2);
      expect(result.current[1]).toBe(1);
      expect(promise).toBe(result.current[0]);
      await act(async () => await expect(promise).resolves.toBe("Success"));

      // Verificar caché
      const cacheEntry = cache.getCache("key7");
      expect(cacheEntry?.value).toBe("Success");
      expect(cacheEntry?.isValid?.()).toBe(true);

      // Re-renderizar para usar caché
      rerender();
      expect(result.current[0]).resolves.toBe("Success");
      expect(resource).toHaveBeenCalledTimes(2); // No se llamó de nuevo
    });

    test("don't evaluate resource if cached value is present and valid", async () => {
      const resource = jest.fn(
        () =>
          new Promise((resolve) => setTimeout(() => resolve("Success"), 100))
      );
      cache.setCache("key8", "Cached", 10000);

      const { result } = renderHook(() =>
        usePromise(
          resource,
          true,
          1,
          1000,
          "linear",
          true,
          10000,
          undefined,
          undefined,
          "key8"
        )
      );

      await expect(result.current[0]).resolves.toBe("Cached");
      expect(resource).not.toHaveBeenCalled();
    });

    test("retries if cache is expired and caches new result on rerender", async () => {
      let callCount = 0;
      const resource = jest.fn(() => {
        callCount++;
        if (callCount < 2) {
          return new Promise((resolve, reject) =>
            setTimeout(() => reject("Failed"), 100)
          );
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve("New Success"), 100)
        );
      });
      cache.setCache("key9", "Old Cached", 100);

      const { result, rerender } = await act(() =>
        renderHook(() =>
          usePromise(
            resource,
            true,
            1,
            undefined,
            undefined,
            true,
            100,
            undefined,
            undefined,
            "key9"
          )
        )
      );

      // Caché válido inicialmente
      await expect(result.current[0]).resolves.toBe("Old Cached");
      expect(resource).not.toHaveBeenCalled();

      // Expirar caché
      await act(async () => {
        await delay(200);
      });

      // Re-renderizar para forzar reintentos
      await act(() => rerender());

      const promise = result.current[0];
      // Intento 0: falla
      expect(result.current[1]).toBe(0);
      expect(resource).toHaveBeenCalledTimes(1);
      await act(async () => {
        await delay(110);
      });

      // Intento 1: éxito
      expect(result.current[1]).toBe(1);
      expect(resource).toHaveBeenCalledTimes(2);
      await expect(promise).resolves.toBe("New Success");

      // Verificar nuevo caché
      const cacheEntry = cache.getCache("key9");
      expect(cacheEntry?.value).toBe("New Success");
      expect(cacheEntry?.isValid?.()).toBe(true);
    });

    test("respects cancellation with retry and cache on unmount", async () => {
      const resource = jest.fn(
        () =>
          new Promise((_, reject) => setTimeout(() => reject("Failed"), 100))
      );
      const { result, unmount } = renderHook(() =>
        usePromise(
          resource,
          true,
          2,
          undefined,
          undefined,
          true,
          10000,
          undefined,
          undefined,
          "key10"
        )
      );
      const promise = result.current[0];
      // Intento 0: falla
      expect(result.current[1]).toBe(0);
      expect(resource).toHaveBeenCalledTimes(1);
      await act(async () => {
        await delay(110);
      });
      // Intento 1
      expect(result.current[1]).toBe(1);
      expect(resource).toHaveBeenCalledTimes(2);

      // Desmontar para cancelar
      await act(async () => {
        unmount();
      });

      // No se realizan más intentos
      await act(async () => {
        await delay(1000);
      });
      expect(resource).toHaveBeenCalledTimes(2);
      expect(cache.getCache("key10")).toBeNull();
    });
  });

  describe("retry in Strict Mode", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
    });

    afterEach(() => {
      // cache.default.clearCache(); // Clear cache after each test
      jest.useRealTimers();
    });
    test("retries correctly in Strict Mode", async () => {
      let callCount = 0;
      const resource = jest.fn(() => {
        callCount++;
        if (callCount < 2) {
          return new Promise((_, reject) =>
            setTimeout(() => reject("Failed"), 100)
          );
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve("Success"), 100)
        );
      });

      const { result } = renderHook(() => usePromise(resource, true, 1), {
        wrapper: StrictMode,
      });
      const promise = result.current[0];
      // Intento 0: falla
      expect(resource).toHaveBeenCalledTimes(1);
      expect(result.current[1]).toBe(0);
      await act(async () => {
        await delay(110);
      });

      // Intento 1: éxito
      expect(result.current[1]).toBe(1);
      expect(resource).toHaveBeenCalledTimes(2);
      await expect(promise).resolves.toBe("Success");
    });

    test("retries with cache in Strict Mode", async () => {
      let callCount = 0;
      const resource = jest.fn(() => {
        callCount++;
        if (callCount < 2) {
          return new Promise((_, reject) =>
            setTimeout(() => reject("Failed"), 100)
          );
        }
        return new Promise((resolve) =>
          setTimeout(() => resolve("Success"), 100)
        );
      });

      const { result } = renderHook(
        () =>
          usePromise(
            resource,
            true,
            1,
            undefined,
            undefined,
            true,
            10000,
            undefined,
            undefined,
            "key11"
          ),
        { wrapper: StrictMode }
      );
      const promise = result.current[0];
      // Intento 0: falla
      expect(resource).toHaveBeenCalledTimes(1);
      expect(result.current[1]).toBe(0);
      await act(async () => {
        await delay(110);
      });

      // Intento 1: éxito
      expect(resource).toHaveBeenCalledTimes(2);
      expect(result.current[1]).toBe(1);
      await expect(promise).resolves.toBe("Success");

      // Verificar caché
      const cacheEntry = cache.getCache("key11");
      expect(cacheEntry?.value).toBe("Success");
    });
  });

  describe("without retry", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useRealTimers();
    });

    afterEach(() => {
      // cache.default.clearCache(); // Clear cache after each test
      jest.useRealTimers();
      jest.resetAllMocks();
    });

    test("respects cacheTTL expiration", async () => {
      const resource = jest.fn(
        () => new Promise((resolve) => setTimeout(() => resolve("data"), 100))
      );
      const { rerender, result } = await act(() =>
        renderHook(() =>
          usePromise(
            resource,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            1000,
            undefined,
            undefined,
            "key1"
          )
        )
      );

      expect(resource).toHaveBeenCalledTimes(INITIAL_NUMBER_OF_CALLS);

      expect(await result.current[0]).toBe("data");

      await act(async () => {
        rerender();
        expect(await result.current[0]).toBe("data");
      });
      expect(resource).toHaveBeenCalledTimes(INITIAL_NUMBER_OF_CALLS);

      await act(async () => {
        await delay(1010); // Avanzar 1001ms
        await Promise.resolve(); // Asegurar que las microtasks se resuelvan
      });

      await act(async () => {
        rerender();
        expect(await result.current[0]).toBe("data");
      });
      expect(resource).toHaveBeenCalledTimes(INITIAL_NUMBER_OF_CALLS + 1);
    });

    test("reuses pending promise", async () => {
      let resolvePromise: (value: unknown) => void;
      const resource = jest.fn(
        () => new Promise((resolve) => (resolvePromise = resolve))
      );
      const { rerender, result } = renderHook(() =>
        usePromise(
          resource,
          undefined,
          undefined,
          undefined,
          undefined,
          true,
          1000,
          undefined,
          undefined,
          "key2"
        )
      );
      rerender(); // Simula un re-render mientras la promesa está pendiente
      expect(resource).toHaveBeenCalledTimes(INITIAL_NUMBER_OF_CALLS); // No se crea una nueva promesa
      await act(async () => resolvePromise("data"));
      rerender(); // Simula otro re-render
      expect(resource).toHaveBeenCalledTimes(INITIAL_NUMBER_OF_CALLS);
      expect(await result.current[0]).toBe("data");
    });

    test("does nothing if cacheKey is undefined", async () => {
      const mockGetCache = jest.spyOn(cache, "getCache").mockReturnValue(null);
      const mockSetCache = jest
        .spyOn(cache, "setCache")
        .mockImplementation(() => {});
      const mockDeleteCache = jest
        .spyOn(cache, "deleteCache")
        .mockImplementation(() => {});
      const resource = jest.fn(
        () => new Promise((resolve) => setTimeout(() => resolve("data"), 100))
      );
      const { result } = renderHook(() =>
        usePromise(
          resource,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          1000,
          1,
          true,
          "some-resource-id"
        )
      );
      expect(mockGetCache).not.toHaveBeenCalled();
      expect(mockSetCache).not.toHaveBeenCalled();
      expect(mockDeleteCache).not.toHaveBeenCalled();
      await expect(result.current[0]).resolves.toBe("data");
    });

    test("deletes cache on cacheVersion change", () => {
      const mockDeleteCache = jest
        .spyOn(cache, "deleteCache")
        .mockImplementation(() => {});
      const resource = jest.fn(
        () => new Promise((resolve) => setTimeout(() => resolve("data"), 100))
      );
      const { rerender } = renderHook(
        ({ cacheKey, cacheVersion }) =>
          usePromise(
            resource,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            1000,
            cacheVersion,
            true,
            cacheKey
          ),
        { initialProps: { cacheKey: "key3", cacheVersion: 1 } }
      );
      expect(mockDeleteCache).not.toHaveBeenCalled();
      rerender({ cacheKey: "key3", cacheVersion: 2 });
      expect(mockDeleteCache).toHaveBeenCalledWith("key3");
    });

    test("updates cache on cachePersist change", () => {
      const mockGetCache = jest.spyOn(cache, "getCache").mockReturnValue({
        value: "value1",
        expiry: 1000,
        isValid: function () {
          return true;
        },
      });
      const mockSetCache = jest
        .spyOn(cache, "setCache")
        .mockImplementation(() => {});
      const mockDeleteCache = jest
        .spyOn(cache, "deleteCache")
        .mockImplementation(() => {});
      const { rerender } = renderHook(
        ({ cacheKey, cachePersist }) =>
          usePromise(
            resource,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            1000,
            1,
            cachePersist,
            cacheKey
          ),
        { initialProps: { cacheKey: "key4", cachePersist: false } }
      );
      rerender({ cacheKey: "key4", cachePersist: true });
      expect(mockGetCache).toHaveBeenCalledWith("key4");
      expect(mockDeleteCache).toHaveBeenCalledWith("key4");
      expect(mockSetCache).toHaveBeenCalledWith("key4", "value1", 1000, true);
    });

    test("updates cache on cacheTTL change", () => {
      const mockGetCache = jest.spyOn(cache, "getCache").mockReturnValue({
        value: "value1",
        expiry: 1000,
        isValid: function () {
          return true;
        },
      });
      const mockSetCache = jest
        .spyOn(cache, "setCache")
        .mockImplementation(() => {});
      const mockDeleteCache = jest
        .spyOn(cache, "deleteCache")
        .mockImplementation(() => {});
      const { rerender } = renderHook(
        ({ cacheKey, cacheTTL }) =>
          usePromise(
            resource,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            cacheTTL,
            1,
            false,
            cacheKey
          ),
        { initialProps: { cacheKey: "key5", cacheTTL: 1000 } }
      );
      rerender({ cacheKey: "key5", cacheTTL: 2000 });
      expect(mockGetCache).toHaveBeenCalledWith("key5");
      expect(mockDeleteCache).toHaveBeenCalledWith("key5");
      expect(mockSetCache).toHaveBeenCalledWith("key5", "value1", 2000, false);
    });

    test("does not update cache if no cached value exists", () => {
      const mockGetCache = jest.spyOn(cache, "getCache").mockReturnValue(null);
      const mockSetCache = jest
        .spyOn(cache, "setCache")
        .mockImplementation(() => {});
      const mockDeleteCache = jest
        .spyOn(cache, "deleteCache")
        .mockImplementation(() => {});
      const resource = jest.fn(
        () => new Promise((resolve) => setTimeout(() => resolve("data"), 100))
      );
      const { rerender } = renderHook(
        ({ cacheKey, cacheTTL }) =>
          usePromise(
            resource,
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            cacheTTL,
            1,
            false,
            cacheKey
          ),
        { initialProps: { cacheKey: "key6", cacheTTL: 1000 } }
      );
      rerender({ cacheKey: "key6", cacheTTL: 2000 });
      expect(mockGetCache).toHaveBeenCalledWith("key6");
      expect(mockDeleteCache).not.toHaveBeenCalled();
      expect(mockSetCache).not.toHaveBeenCalled();
    });
  });
});
