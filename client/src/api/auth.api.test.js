import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from './auth.api.js';

const { mockPost } = vi.hoisted(() => ({ mockPost: vi.fn() }));

vi.mock('./axios.js', () => ({
  default: {
    post: mockPost,
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('calls the login endpoint with credentials', async () => {
    mockPost.mockResolvedValue({ data: { ok: true } });

    await expect(authApi.login({ email: 'user@example.com', password: 'Password123!' })).resolves.toEqual({
      data: { ok: true },
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'user@example.com', password: 'Password123!' });
  });

  it('calls the logout endpoint', async () => {
    mockPost.mockResolvedValue({ data: { status: 'success' } });

    await expect(authApi.logout()).resolves.toEqual({ data: { status: 'success' } });
    expect(mockPost).toHaveBeenCalledWith('/auth/logout');
  });
});
