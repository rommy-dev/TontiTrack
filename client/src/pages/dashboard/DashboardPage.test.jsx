import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import DashboardPage from './DashboardPage.jsx';
import { useAuthStore } from '../../store/authStore.js';

vi.mock('../../hooks/useDashboard.js', () => ({
  useDashboardKpis: () => ({
    data: {
      currency: 'XAF',
      contributions: {
        countLate: 1,
        countPaid: 2,
        countPending: 1,
        countPartial: 1,
        totalLateRemaining: 250000,
        totalLatePenalty: 12500,
        completionRate: 50,
      },
      groups: { active: 2, total: 3 },
      thisMonth: { totalPaid: 150000 },
    },
    isLoading: false,
  }),
}));

vi.mock('../../components/charts/MonthlyChart.jsx', () => ({ default: () => <div data-testid="monthly-chart" /> }));
vi.mock('../../components/charts/StatusDonut.jsx', () => ({ default: () => <div data-testid="status-donut" /> }));
vi.mock('../../components/charts/DebtTable.jsx', () => ({ default: () => <div data-testid="debt-table" /> }));
vi.mock('../../components/transactions/TransactionHistory.jsx', () => ({ default: () => <div data-testid="transaction-history" /> }));

describe('DashboardPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { firstName: 'Ada' }, isAuth: true });
  });

  it('renders the dashboard KPIs and late-payment alert', () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/bonjour, ada/i)).toBeInTheDocument();
    expect(screen.getByText(/groupes actifs/i)).toBeInTheDocument();
    expect(screen.getByText(/1 contribution/i)).toBeInTheDocument();
    expect(screen.getByText(/des pénalités s'accumulent/i)).toBeInTheDocument();
    expect(screen.getByTestId('monthly-chart')).toBeInTheDocument();
    expect(screen.getByTestId('transaction-history')).toBeInTheDocument();
  });
});
