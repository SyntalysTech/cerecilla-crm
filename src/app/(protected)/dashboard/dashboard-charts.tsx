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
  color?: string;
}

interface DashboardChartsProps {
  emailsByDay: EmailDayData[];
  emailStatus: StatusData[];
  clientesCount: number;
  operariosCount: number;
  serviciosData: StatusData[];
  provinciasData: StatusData[];
}

// Color palette for charts
const COLORS = ["#BB292A", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const SERVICE_COLORS: Record<string, string> = {
  Luz: "#f59e0b",
  Gas: "#ef4444",
  Telefonía: "#3b82f6",
  Seguros: "#22c55e",
  Alarmas: "#8b5cf6",
};

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
          data={filteredData as { name: string; value: number; color?: string; [key: string]: unknown }[]}
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
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
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

const ServiciosPieChart = memo(function ServiciosPieChart({ data }: { data: StatusData[] }) {
  const dataWithColors = data.map((item) => ({
    ...item,
    color: SERVICE_COLORS[item.name] || COLORS[0],
  }));
  return (
    <ResponsiveContainer width="100%" height="100%" debounce={100}>
      <PieChart>
        <Pie
          data={dataWithColors}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          isAnimationActive={false}
          label={({ name, value }) => `${name}: ${value}`}
          labelLine={false}
        >
          {dataWithColors.map((entry, index) => (
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

const ProvinciasBarChart = memo(function ProvinciasBarChart({ data }: { data: StatusData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" debounce={100}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="value" name="Clientes" fill="#BB292A" radius={[0, 4, 4, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
});

export function DashboardCharts({
  emailsByDay,
  emailStatus,
  serviciosData,
  provinciasData,
}: DashboardChartsProps) {
  const hasEmailActivity = emailsByDay.some((d) => d.enviados > 0 || d.fallidos > 0);
  const hasEmailStatus = emailStatus.some((s) => s.value > 0);
  const hasServiciosData = serviciosData.length > 0;
  const hasProvinciasData = provinciasData.length > 0;

  return (
    <>
      {/* Email charts row */}
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

      {/* Comisionables charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Servicios comisionables */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Servicios comisionables
          </h3>
          {hasServiciosData ? (
            <div className="h-64">
              <ServiciosPieChart data={serviciosData} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay clientes comisionables
            </div>
          )}
        </div>

        {/* Provincias con más clientes comisionables */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Top 10 provincias (comisionables)
          </h3>
          {hasProvinciasData ? (
            <div className="h-64">
              <ProvinciasBarChart data={provinciasData} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay datos de provincias
            </div>
          )}
        </div>
      </div>
    </>
  );
}
