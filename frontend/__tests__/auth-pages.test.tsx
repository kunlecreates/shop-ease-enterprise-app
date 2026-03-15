import React from 'react';
import { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import LoginPage from '../app/login/page';
import RegisterPage from '../app/register/page';
import { apiClient } from '../lib/api-client';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pushMock = jest.fn();
const loginMock = jest.fn();
const registerMock = jest.fn();
const alertMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement('a', { href }, children),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login: loginMock, register: registerMock }),
}));

function flushPromises() {
  return Promise.resolve();
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor?.set?.call(input, value);
}

function findInputByLabel(container: HTMLElement, label: string): HTMLInputElement {
  const labels = Array.from(container.querySelectorAll('label'));
  const targetLabel = labels.find((candidate) => candidate.textContent?.includes(label));

  if (!targetLabel) {
    throw new Error(`Label not found: ${label}`);
  }

  const inputId = targetLabel.getAttribute('for');
  if (!inputId) {
    throw new Error(`No htmlFor found for label: ${label}`);
  }

  const input = document.getElementById(inputId);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`Input not found for label: ${label}`);
  }

  return input;
}

function findButton(container: HTMLElement, label: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!button) {
    throw new Error(`Button not found: ${label}`);
  }

  return button as HTMLButtonElement;
}

async function changeInput(container: HTMLElement, label: string, value: string) {
  await act(async () => {
    const input = findInputByLabel(container, label);
    setNativeInputValue(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await flushPromises();
  });
}

async function click(container: HTMLElement, label: string) {
  await act(async () => {
    findButton(container, label).click();
    await flushPromises();
  });
}

async function submitFirstForm(container: HTMLElement) {
  const form = container.querySelector('form');
  if (!(form instanceof HTMLFormElement)) {
    throw new Error('Form not found');
  }

  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flushPromises();
  });
}

describe('Auth Pages', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    Object.defineProperty(window, 'alert', {
      value: alertMock,
      configurable: true,
    });
    jest.spyOn(apiClient, 'post').mockResolvedValue({} as never);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  test('login redirects admins to /admin after successful sign-in', async () => {
    loginMock.mockImplementation(async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'ADMIN' }));
    });

    await act(async () => {
      root.render(React.createElement(LoginPage));
      await flushPromises();
    });

    await changeInput(container, 'Email', 'admin@example.com');
    await changeInput(container, 'Password', 'password123');
    await submitFirstForm(container);

    expect(loginMock).toHaveBeenCalledWith('admin@example.com', 'password123');
    expect(pushMock).toHaveBeenCalledWith('/admin');
  });

  test('login shows resend verification action for email verification failures', async () => {
    loginMock.mockRejectedValue(new Error('Email not verified. Please verify your email first.'));

    await act(async () => {
      root.render(React.createElement(LoginPage));
      await flushPromises();
    });

    await changeInput(container, 'Email', 'user@example.com');
    await changeInput(container, 'Password', 'password123');
    await submitFirstForm(container);

    expect(container.textContent).toContain('Email not verified');
    expect(container.textContent).toContain('Resend Verification Email');

    await click(container, 'Resend Verification Email');

    expect(apiClient.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'user@example.com' });
    expect(alertMock).toHaveBeenCalledWith('Verification email has been resent! Please check your inbox.');
  });

  test('register blocks mismatched passwords before calling auth context', async () => {
    await act(async () => {
      root.render(React.createElement(RegisterPage));
      await flushPromises();
    });

    await changeInput(container, 'Username', 'tester');
    await changeInput(container, 'Email', 'tester@example.com');
    await changeInput(container, 'Password', 'password123');
    await changeInput(container, 'Confirm Password', 'different123');
    await submitFirstForm(container);

    expect(registerMock).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Passwords do not match');
  });

  test('register shows verification screen when registration completes without auto-login', async () => {
    registerMock.mockResolvedValue(undefined);

    await act(async () => {
      root.render(React.createElement(RegisterPage));
      await flushPromises();
    });

    await changeInput(container, 'Username', 'tester');
    await changeInput(container, 'Email', 'tester@example.com');
    await changeInput(container, 'Password', 'password123');
    await changeInput(container, 'Confirm Password', 'password123');
    await submitFirstForm(container);

    expect(registerMock).toHaveBeenCalledWith('tester', 'tester@example.com', 'password123');
    expect(container.textContent).toContain('Check your email');
    expect(container.textContent).toContain('tester@example.com');

    await click(container, 'Resend Verification Email');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'tester@example.com' });
  });

  test('register redirects to /products when auth token exists after registration', async () => {
    registerMock.mockImplementation(async () => {
      localStorage.setItem('auth_token', 'fresh-token');
    });

    await act(async () => {
      root.render(React.createElement(RegisterPage));
      await flushPromises();
    });

    await changeInput(container, 'Username', 'tester');
    await changeInput(container, 'Email', 'tester@example.com');
    await changeInput(container, 'Password', 'password123');
    await changeInput(container, 'Confirm Password', 'password123');
    await submitFirstForm(container);

    expect(pushMock).toHaveBeenCalledWith('/products');
  });

  test('login redirects to /profile when user payload is absent in localStorage', async () => {
    loginMock.mockResolvedValue(undefined);

    await act(async () => {
      root.render(React.createElement(LoginPage));
      await flushPromises();
    });

    await changeInput(container, 'Email', 'user@example.com');
    await changeInput(container, 'Password', 'password123');
    await submitFirstForm(container);

    expect(loginMock).toHaveBeenCalledWith('user@example.com', 'password123');
    expect(pushMock).toHaveBeenCalledWith('/profile');
  });

  test('login shows resend verification failure message when resend request fails', async () => {
    loginMock.mockRejectedValue(new Error('Email verification required'));
    jest.spyOn(apiClient, 'post').mockRejectedValue(new Error('Resend temporarily unavailable') as never);

    await act(async () => {
      root.render(React.createElement(LoginPage));
      await flushPromises();
    });

    await changeInput(container, 'Email', 'user@example.com');
    await changeInput(container, 'Password', 'password123');
    await submitFirstForm(container);
    await click(container, 'Resend Verification Email');

    expect(container.textContent).toContain('Resend temporarily unavailable');
    expect(alertMock).not.toHaveBeenCalled();
  });

  test('register verification screen can navigate back to login', async () => {
    registerMock.mockResolvedValue(undefined);

    await act(async () => {
      root.render(React.createElement(RegisterPage));
      await flushPromises();
    });

    await changeInput(container, 'Username', 'tester');
    await changeInput(container, 'Email', 'tester@example.com');
    await changeInput(container, 'Password', 'password123');
    await changeInput(container, 'Confirm Password', 'password123');
    await submitFirstForm(container);

    await click(container, 'Back to Login');

    expect(pushMock).toHaveBeenCalledWith('/login');
  });
});