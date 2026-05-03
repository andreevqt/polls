interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
}

export default function StatCard({ title, value, icon, description, trend }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          {trend && (
            <p
              className={`mt-1 text-sm font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-2xl">
          {icon}
        </div>
      </div>
    </div>
  );
}
