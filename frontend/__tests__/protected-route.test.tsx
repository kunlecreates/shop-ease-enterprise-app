import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ProtectedRoute } from '../components/ProtectedRoute';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pushMock = jest.fn();
const useAuthMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

describe('ProtectedRoute', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
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

  async function renderRoute(adminOnly = false) {
    await act(async () => {
      root.render(
        React.createElement(
          ProtectedRoute,
          { adminOnly },
          React.createElement('div', null, 'Protected Content'),
        ),
      );
      await Promise.resolve();
    });
  }

  test('shows a loading spinner while auth state is loading', async () => {
    useAuthMock.mockReturnValue({ isLoading: true, isAuthenticated: false, user: null });

    await renderRoute();

    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(pushMock).not.toHaveBeenCalled();
  });

  test('redirects unauthenticated users to login', async () => {
    useAuthMock.mockReturnValue({ isLoading: false, isAuthenticated: false, user: null });

    await renderRoute();

    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(container.textContent).not.toContain('Protected Content');
  });

  test('redirects non-admin users away from admin-only content', async () => {
    useAuthMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { role: 'CUSTOMER' },
    });

    await renderRoute(true);

    expect(pushMock).toHaveBeenCalledWith('/');
    expect(container.textContent).not.toContain('Protected Content');
  });

  test('renders children for authenticated admins on admin-only routes', async () => {
    useAuthMock.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { role: 'ADMIN' },
    });

    await renderRoute(true);

    expect(pushMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Protected Content');
  });
});