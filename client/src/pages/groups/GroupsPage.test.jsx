import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GroupsPage from './GroupsPage.jsx';

const createGroupMock = vi.fn();
const groups = [
  {
    _id: 'group-1',
    name: 'Tontine A',
    type: 'tontine',
    status: 'active',
    members: [{ role: 'admin' }],
    settings: { targetAmount: 50000, currency: 'XAF', frequency: 'monthly' },
  },
];

vi.mock('../../hooks/useGroups.js', () => ({
  useGroups: () => ({ data: groups, isLoading: false }),
  useCreateGroup: () => ({ mutate: createGroupMock, isPending: false }),
}));

describe('GroupsPage', () => {
  beforeEach(() => {
    createGroupMock.mockReset();
  });

  it('filters groups by search and submits the create-group form', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <GroupsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Tontine A')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/rechercher un groupe/i), 'zzz');
    expect(screen.queryByText('Tontine A')).not.toBeInTheDocument();
    expect(screen.getByText(/aucun groupe trouvé/i)).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText(/rechercher un groupe/i));
    await user.click(screen.getByRole('button', { name: /nouveau groupe/i }));

    await user.type(screen.getByLabelText(/nom du groupe/i), 'Tontine B');
    await user.type(screen.getByLabelText(/montant cible par cycle/i), '12000');
    await user.click(screen.getByRole('button', { name: /créer le groupe/i }));

    expect(createGroupMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Tontine B',
        settings: expect.objectContaining({ targetAmount: 12000 }),
      }),
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });
});
