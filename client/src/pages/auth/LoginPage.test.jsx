import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage.jsx';

const loginMock = vi.fn();

vi.mock('../../hooks/useAuth.js', () => ({
  useLogin: () => ({ mutate: loginMock, isPending: false }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset();
  });

  it('shows validation errors and submits valid credentials', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(screen.getByText(/email requis/i)).toBeInTheDocument();
    expect(screen.getByText(/mot de passe requis/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/adresse email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/mot de passe/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(loginMock).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
    });
  });
});
