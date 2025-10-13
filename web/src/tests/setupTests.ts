import "@testing-library/jest-dom";

// Lightweight IntersectionObserver mock for jsdom environment used in tests.
// framer-motion's viewport/InView features rely on IntersectionObserver which
// is not available in jsdom. This minimal mock prevents mount-time errors.
class MockIntersectionObserver {
  constructor(public callback?: IntersectionObserverCallback) {}
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof (globalThis as any).IntersectionObserver === "undefined") {
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
}

// jsdom doesn't implement matchMedia; provide a minimal mock used by `use-mobile` hook
if (typeof (globalThis as any).matchMedia === "undefined") {
  Object.defineProperty(globalThis, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// add any additional global mocks or polyfills here if needed in future
