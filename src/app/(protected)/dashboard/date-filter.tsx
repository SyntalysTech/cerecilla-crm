"use client";

import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export type DateRange = "all" | "7d" | "30d" | "90d" | "year" | "custom";

interface DateFilterProps {
  value: DateRange;
  onChange: (range: DateRange, startDate?: Date, endDate?: Date) => void;
  startDate?: Date;
  endDate?: Date;
}

const rangeLabels: Record<DateRange, string> = {
  all: "Todo el tiempo",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  year: "Este año",
  custom: "Personalizado",
};

export function DateFilter({ value, onChange, startDate, endDate }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState<string>(
    startDate ? startDate.toISOString().split("T")[0] : ""
  );
  const [customEnd, setCustomEnd] = useState<string>(
    endDate ? endDate.toISOString().split("T")[0] : ""
  );

  const handleSelect = (range: DateRange) => {
    if (range === "custom") {
      setShowCustom(true);
      return;
    }

    setShowCustom(false);
    setIsOpen(false);

    let start: Date | undefined;
    const end = new Date();

    switch (range) {
      case "7d":
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start = new Date();
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start = new Date();
        start.setDate(start.getDate() - 90);
        break;
      case "year":
        start = new Date(end.getFullYear(), 0, 1);
        break;
      case "all":
      default:
        start = undefined;
        break;
    }

    onChange(range, start, range === "all" ? undefined : end);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange("custom", new Date(customStart), new Date(customEnd));
      setIsOpen(false);
      setShowCustom(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-gray-700">{rangeLabels[value]}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
          <div className="py-1">
            {Object.entries(rangeLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleSelect(key as DateRange)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  value === key ? "bg-red-50 text-[#BB292A]" : "text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {showCustom && (
            <div className="border-t border-gray-200 p-3">
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Desde</label>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                </div>
                <button
                  onClick={handleCustomApply}
                  disabled={!customStart || !customEnd}
                  className="w-full px-3 py-1.5 text-sm bg-[#BB292A] text-white rounded hover:bg-[#a02324] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
