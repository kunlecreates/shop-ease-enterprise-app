import { request } from './http';

type CleanupFn = () => Promise<void>;

let cleanupFns: CleanupFn[] = [];

export function registerCleanup(fn: CleanupFn) {
  cleanupFns.push(fn);
}

export async function teardownAll() {
  // run in reverse order
  for (const fn of cleanupFns.reverse()) {
    try {
      await fn();
    } catch (e) {
      // swallow errors during cleanup
    }
  }
  cleanupFns = [];
}

// Helper shortcuts for common resources
export function registerDelete(pathTemplate: (id: any) => string, id: any) {
  registerCleanup(async () => {
    try {
      await request('delete', pathTemplate(id));
    } catch (e) {
      // ignore
    }
  });
}
