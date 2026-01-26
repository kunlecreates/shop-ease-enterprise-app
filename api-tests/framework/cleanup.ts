import { productHttp, userHttp, orderHttp, notificationHttp } from './http';
import { AxiosInstance } from 'axios';

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
export function registerDelete(
  httpClient: AxiosInstance,
  pathTemplate: (id: any) => string,
  id: any,
  token?: string
) {
  registerCleanup(async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await httpClient.delete(pathTemplate(id), { headers, validateStatus: () => true });
    } catch (e) {
      // ignore cleanup errors
    }
  });
}
