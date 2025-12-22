"use client";

import { memo, useState, useEffect, useCallback } from "react";
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
import { SpainMap } from "./spain-map";
import { DateFilter, DateRange } from "./date-filter";
import { createClient } from "@/lib/supabase/client";

interface StatusData {
  name: string;
  value: number;
  color?: string;
}

interface ComisionablesChartsProps {
  initialServiciosData: StatusData[];
  initialProvinciasData: StatusData[];
  initialMapData: Record<string, number>;
}

const COLORS = ["#BB292A", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const SERVICE_COLORS: Record<string, string> = {
  Luz: "#f59e0b",
  Gas: "#ef4444",
  Telefonía: "#3b82f6",
  Seguros: "#22c55e",
  Alarmas: "#8b5cf6",
};

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

export function ComisionablesCharts({
  initialServiciosData,
  initialProvinciasData,
  initialMapData,
}: ComisionablesChartsProps) {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  const [serviciosData, setServiciosData] = useState(initialServiciosData);
  const [provinciasData, setProvinciasData] = useState(initialProvinciasData);
  const [mapData, setMapData] = useState(initialMapData);

  const fetchFilteredData = useCallback(async (start?: Date, end?: Date) => {
    setLoading(true);
    try {
      const supabase = createClient();

      let query = supabase
        .from("clientes")
        .select("servicio, provincia, created_at")
        .eq("estado", "COMISIONABLE");

      if (start) {
        query = query.gte("created_at", start.toISOString());
      }
      if (end) {
        query = query.lte("created_at", end.toISOString());
      }

      const { data: clientes } = await query;

      // Process servicios distribution
      const serviciosCount: Record<string, number> = { Luz: 0, Gas: 0, Telefonía: 0, Seguros: 0, Alarmas: 0 };
      const provinciasCount: Record<string, number> = {};

      clientes?.forEach((cliente) => {
        if (cliente.servicio) {
          const servicios = cliente.servicio.split(", ");
          servicios.forEach((s: string) => {
            if (serviciosCount[s] !== undefined) {
              serviciosCount[s]++;
            }
          });
        }
        if (cliente.provincia) {
          provinciasCount[cliente.provincia] = (provinciasCount[cliente.provincia] || 0) + 1;
        }
      });

      const newServiciosData = Object.entries(serviciosCount)
        .filter(([, count]) => count > 0)
        .map(([name, value]) => ({ name, value }));

      const newProvinciasData = Object.entries(provinciasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }));

      setServiciosData(newServiciosData);
      setProvinciasData(newProvinciasData);
      setMapData(provinciasCount);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateChange = useCallback((range: DateRange, start?: Date, end?: Date) => {
    setDateRange(range);
    setStartDate(start);
    setEndDate(end);

    if (range === "all") {
      setServiciosData(initialServiciosData);
      setProvinciasData(initialProvinciasData);
      setMapData(initialMapData);
    } else {
      fetchFilteredData(start, end);
    }
  }, [fetchFilteredData, initialServiciosData, initialProvinciasData, initialMapData]);

  const hasServiciosData = serviciosData.length > 0;
  const hasProvinciasData = provinciasData.length > 0;
  const hasMapData = Object.keys(mapData).length > 0;

  return (
    <>
      {/* Filter header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Clientes comisionables</h2>
        <DateFilter
          value={dateRange}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
        />
      </div>

      {/* Comisionables charts row */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 ${loading ? "opacity-50" : ""}`}>
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

      {/* Spain map */}
      <div className={`grid grid-cols-1 gap-6 mb-6 ${loading ? "opacity-50" : ""}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Mapa de clientes comisionables por comunidad
          </h3>
          {hasMapData ? (
            <div className="h-[500px]">
              <SpainMap data={mapData} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No hay datos de ubicaciones
            </div>
          )}
        </div>
      </div>
    </>
  );
}
