import { render, screen, act, fireEvent } from "@testing-library/react";
import { StrictMode, useState } from "react";
import Suspense from "../enhanced-suspense";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const resourceA = jest.fn(
  () => new Promise((resolve) => setTimeout(() => resolve("data"), 1000))
);
const resourceB = jest.fn(
  () => new Promise((resolve) => setTimeout(() => resolve("data"), 1000))
);

describe("EnhancedSuspense", () => {
  test("works with cache in Strict Mode", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <StrictMode>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense
            resourceId="key1"
            cache
            cacheTTL={100}
            fallback="Loading..."
          >
            {resourceA}
          </Suspense>
        </StrictMode>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(1010)); // Espera a que se resuelva la promesa
    expect(screen.getByText("data")).toBeInTheDocument();
    await act(async () => await delay(110)); // Expira el caché
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument(); // Debería mostrar loading después de expiración
    await act(async () => await delay(1010));
    expect(screen.getByText("data")).toBeInTheDocument(); // Debería mostrar el resultado después de la expiración
    expect(resourceA).toHaveBeenCalledTimes(2); // Llamado nuevamente
  });

  test("works with cache in Strict Mode and inline resource definition", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <StrictMode>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense
            resourceId="key2"
            cache
            cacheTTL={100}
            fallback="Loading..."
          >
            {() =>
              new Promise((resolve) => setTimeout(() => resolve("data"), 1000))
            }
          </Suspense>
        </StrictMode>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(1010)); // Espera a que se resuelva la promesa
    expect(screen.getByText("data")).toBeInTheDocument();
    await act(async () => await delay(110)); // Expira el caché
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(await screen.findByText("Loading...")).toBeInTheDocument(); // Debería mostrar loading después de expiración
    await act(async () => await delay(1010));
    expect(screen.getByText("data")).toBeInTheDocument(); // Debería mostrar el resultado después de la expiración
  });

  test("works with cache not in Strict Mode", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense
            resourceId="key3"
            cache
            cacheTTL={100}
            fallback="Loading..."
          >
            {resourceB}
          </Suspense>
        </>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(1010)); // Espera a que se resuelva la promesa
    expect(screen.getByText("data")).toBeInTheDocument();
    await act(async () => await delay(110)); // Expira el caché
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument(); // Debería mostrar loading después de expiración
    await act(async () => await delay(1010));
    expect(screen.getByText("data")).toBeInTheDocument(); // Debería mostrar el resultado después de la expiración
    expect(resourceB).toHaveBeenCalledTimes(2); // Llamado nuevamente
  });

  test("works with cache not in Strict Mode and inline resource definition", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense
            resourceId="key4"
            cache
            cacheTTL={100}
            fallback="Loading..."
          >
            {() =>
              new Promise((resolve) => setTimeout(() => resolve("data"), 100))
            }
          </Suspense>
        </>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110)); // Espera a que se resuelva la promesa
    expect(screen.getByText("data")).toBeInTheDocument();
    await act(async () => await delay(110)); // Expira el caché
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument(); // Debería mostrar loading después de expiración
    await act(async () => await delay(110));
    expect(screen.getByText("data")).toBeInTheDocument(); // Debería mostrar el resultado después de la expiración
  });

  test("works without any extra option in strict mode", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <StrictMode>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense fallback="Loading...">
            {new Promise((resolve) => setTimeout(() => resolve("data"), 100))}
          </Suspense>
        </StrictMode>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("data")).toBeInTheDocument();
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("data")).toBeInTheDocument();
  });

  test("works without any extra option without strict mode", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense fallback="Loading...">
            {new Promise((resolve) => setTimeout(() => resolve("data"), 100))}
          </Suspense>
        </>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("data")).toBeInTheDocument();
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("data")).toBeInTheDocument();
  });

  test("works with onSuccess prop without strict mode", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense
            fallback="Loading..."
            onSuccess={(value) => `value is ${value}`}
          >
            {
              new Promise<string>((resolve) =>
                setTimeout(() => resolve("data"), 100)
              )
            }
          </Suspense>
        </>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("value is data")).toBeInTheDocument();
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("value is data")).toBeInTheDocument();
  });

  test("works with onSuccess prop with strict mode", async () => {
    const Component = () => {
      const [, setRerender] = useState(false);
      return (
        <StrictMode>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense
            fallback="Loading..."
            onSuccess={(value) => `value is ${value}`}
          >
            {
              new Promise<string>((resolve) =>
                setTimeout(() => resolve("data"), 100)
              )
            }
          </Suspense>
        </StrictMode>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("value is data")).toBeInTheDocument();
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("value is data")).toBeInTheDocument();
  });

  test("works with onError prop with strict mode", async () => {
    const Component = () => {
      const [rerenderer, setRerender] = useState(false);
      return (
        <StrictMode>
          <button onClick={() => setRerender((r) => !r)}>Rerender</button>
          <Suspense
            fallback="Loading..."
            onError={(error) => `Error: ${error.message}`}
            resourceId={String(rerenderer)}
          >
            {
              new Promise<string>((resolve, reject) =>
                setTimeout(() => reject("Failed"), 100)
              )
            }
          </Suspense>
        </StrictMode>
      );
    };
    await act(() => {
      render(<Component />);
    });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("Error: Failed")).toBeInTheDocument();
    const button = screen.getByText("Rerender");
    await act(() => fireEvent.click(button));
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await act(async () => await delay(110));
    expect(screen.getByText("Error: Failed")).toBeInTheDocument();
  });
});
