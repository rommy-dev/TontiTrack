import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useMonthlyChart } from '../../hooks/useDashboard.js';
import Card    from '../ui/Card.jsx';
import Spinner from '../ui/Spinner.jsx';
import { formatCurrency } from '../../lib/utils.js';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-card text-sm">
      <p className="text-gray-400 dark:text-gray-500 text-xs mb-1">{label}</p>
      <p className="font-semibold text-gray-800 dark:text-gray-100">
        {formatCurrency(payload[0].value)}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
        {payload[0].payload.count} paiement{payload[0].payload.count > 1 ? 's' : ''}
      </p>
    </div>
  );
}

export default function MonthlyChart() {
  const { data, isLoading } = useMonthlyChart();

  return (
    <Card>
      <Card.Header>
        <Card.Title>Collecte mensuelle</Card.Title>
        <span className="text-xs text-gray-400 dark:text-gray-500">6 derniers mois</span>
      </Card.Header>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Spinner className="text-primary-500" />
        </div>
      ) : (
        <div className="h-48 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}    />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-100 dark:text-gray-800"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-500"
                axisLine={false}
                tickLine={false}
              />

              <YAxis
                tickFormatter={(v) => `${Math.round(v / 100)}k`}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-500"
                axisLine={false}
                tickLine={false}
                width={40}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#colorTotal)"
                dot={{ fill: '#6366f1', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}