import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ApiClient } from '../lib/api-client';
import { User } from '../types';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type AuthSnapshot = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const validUser: User = {
  id: 1,
  username: 'tester',
  email: 'tester@example.com',
  role: 'CUSTOMER',
};

function makeToken(expSecondsFromNow: number): string {
  const payload = {
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
  };
  const encoded = btoa(JSON.stringify(payload));
  return `header.${encoded}.signature`;
}

function Probe({ onChange }: { onChange: (snapshot: AuthSnapshot) => void }) {
  const auth = useAuth();
  onChange(auth);
  return null;
}

describe('AuthContext', () => {
  let container: HTMLDivElement;
  let root: Root;
  let latestSnapshot: AuthSnapshot;

  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  async function renderProvider() {
    await act(async () => {
      root.render(
        React.createElement(
          AuthProvider,
          null,
          React.createElement(Probe, {
            onChange: (snapshot: AuthSnapshot) => {
              latestSnapshot = snapshot;
            },
          })
        )
      );
      await Promise.resolve();
    });
  }

  test('restores a valid stored session on mount', async () => {
    localStorage.setItem('auth_token', makeToken(3600));
    localStorage.setItem('user', JSON.stringify(validUser));

    await renderProvider();

    expect(latestSnapshot.isLoading).toBe(false);
    expect(latestSnapshot.isAuthenticated).toBe(true);
    expect(latestSnapshot.user).toEqual(validUser);
  });

  test('clears expired token and stale user on mount', async () => {
    localStorage.setItem('auth_token', makeToken(-3600));
    localStorage.setItem('user', JSON.stringify(validUser));

    await renderProvider();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(latestSnapshot.isAuthenticated).toBe(false);
    expect(latestSnapshot.user).toBeNull();
  });

  test('clears invalid stored user JSON on mount', async () => {
    localStorage.setItem('auth_token', makeToken(3600));
    localStorage.setItem('user', '{bad json');

    await renderProvider();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(latestSnapshot.isAuthenticated).toBe(false);
  });

  test('handles auth:unauthorized event by clearing session', async () => {
    localStorage.setItem('auth_token', makeToken(3600));
    localStorage.setItem('user', JSON.stringify(validUser));
    await renderProvider();

    await act(async () => {
      window.dispatchEvent(new Event('auth:unauthorized'));
      await Promise.resolve();
    });

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(latestSnapshot.isAuthenticated).toBe(false);
    expect(latestSnapshot.user).toBeNull();
  });

  test('login stores token and user in localStorage and updates context', async () => {
    jest.spyOn(ApiClient, 'post').mockResolvedValue({
      token: 'fresh-token',
      user: validUser,
    } as any);

    await renderProvider();

    await act(async () => {
      await latestSnapshot.login('tester@example.com', 'password');
    });

    expect(ApiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'tester@example.com',
      password: 'password',
    });
    expect(localStorage.getItem('auth_token')).toBe('fresh-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(validUser));
    expect(latestSnapshot.isAuthenticated).toBe(true);
    expect(latestSnapshot.user).toEqual(validUser);
  });

  test('register does not persist session when backend returns no token', async () => {
    jest.spyOn(ApiClient, 'post').mockResolvedValue({
      token: null,
      user: validUser,
    } as any);

    await renderProvider();

    await act(async () => {
      await latestSnapshot.register('tester', 'tester@example.com', 'password');
    });

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(latestSnapshot.isAuthenticated).toBe(false);
    expect(latestSnapshot.user).toBeNull();
  });

  test('register persists session when backend returns a token', async () => {
    jest.spyOn(ApiClient, 'post').mockResolvedValue({
      token: 'registered-token',
      user: validUser,
    } as any);

    await renderProvider();

    await act(async () => {
      await latestSnapshot.register('tester', 'tester@example.com', 'password');
    });

    expect(ApiClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'tester@example.com',
      password: 'password',
    });
    expect(localStorage.getItem('auth_token')).toBe('registered-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(validUser));
    expect(latestSnapshot.isAuthenticated).toBe(true);
  });

  test('logout clears session and unauthenticates the user', async () => {
    localStorage.setItem('auth_token', makeToken(3600));
    localStorage.setItem('user', JSON.stringify(validUser));
    await renderProvider();

    act(() => {
      latestSnapshot.logout();
    });

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(latestSnapshot.isAuthenticated).toBe(false);
    expect(latestSnapshot.user).toBeNull();
  });
});