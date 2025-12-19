"use client";

import { memo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface EmailDayData {
  date: string;
  enviados: number;
  fallidos: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface DashboardChartsProps {
  emailsByDay: EmailDayData[];
  emailStatus: StatusData[];
  clientesCount: number;
  operariosCount: number;
}

// Memoize charts to prevent re-renders during sidebar animation
const BarChartMemo = memo(function BarChartMemo({ data }: { data: EmailDayData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" debounce={100}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend />
        <Bar dataKey="enviados" name="Enviados" fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="fallidos" name="Fallidos" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});

const PieChartMemo = memo(function PieChartMemo({ data }: { data: StatusData[] }) {
  const filteredData = data.filter((s) => s.value > 0);
  return (
    <ResponsiveContainer width="100%" height="100%" debounce={100}>
      <PieChart>
        <Pie
          data={filteredData as { name: string; value: number; color: string; [key: string]: unknown }[]}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          isAnimationActive={false}
        >
          {filteredData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
});

export function DashboardCharts({
  emailsByDay,
  emailStatus,
}: DashboardChartsProps) {
  const hasEmailActivity = emailsByDay.some((d) => d.enviados > 0 || d.fallidos > 0);
  const hasEmailStatus = emailStatus.some((s) => s.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Email activity over time */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Actividad de emails (últimos 7 días)
        </h3>
        {hasEmailActivity ? (
          <div className="h-64">
            <BarChartMemo data={emailsByDay} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No hay actividad en los últimos 7 días
          </div>
        )}
      </div>

      {/* Email status distribution */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Distribución de emails</h3>
        {hasEmailStatus ? (
          <div className="h-64">
            <PieChartMemo data={emailStatus} />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No hay datos de emails
          </div>
        )}
      </div>
    </div>
  );
}
