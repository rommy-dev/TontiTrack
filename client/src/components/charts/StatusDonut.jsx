import {
  ResponsiveContainer, PieChart, Pie,
  Cell, Tooltip, Legend,
} from 'recharts';
import { useStatusBreakdown } from '../../hooks/useDashboard.js';
import Card    from '../ui/Card.jsx';
import Spinner from '../ui/Spinner.jsx';

const STATUS_COLORS = {
  paid:      '#22c55e',
  partial:   '#6366f1',
  pending:   '#9ca3af',
  late:      '#f59e0b',
  defaulted: '#ef4444',
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl px-3 py-2 shadow-card text-sm">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: d.payload.fill }}
        />
        <span className="text-gray-700 dark:text-gray-200 font-medium">{d.name}</span>
      </div>
      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
        {d.value} contribution{d.value > 1 ? 's' : ''}
      </p>
    </div>
  );
}

function CustomLegend({ payload }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-xs text-gray-500 dark:text-gray-400">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatusDonut() {
  const { data, isLoading } = useStatusBreakdown();

  const chartData = data?.map((d) => ({
    name:  d.label,
    value: d.count,
    fill:  STATUS_COLORS[d.status] ?? '#9ca3af',
  })) ?? [];

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <Card.Header>
        <Card.Title>Répartition des statuts</Card.Title>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {total} contribution{total > 1 ? 's' : ''}
        </span>
      </Card.Header>

      {isLoading ? (
        <div className="h-48 flex items-center justify-center">
          <Spinner className="text-primary-500" />
        </div>
      ) : total === 0 ? (
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
        </div>
      ) : (
        <div className="h-48">
          <ResponsiveContainer width="99%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}