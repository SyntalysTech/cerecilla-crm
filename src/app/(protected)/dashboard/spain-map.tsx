"use client";

import { memo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

interface SpainMapProps {
  data: Record<string, number>;
}

// Mapping from province names to region IDs
const provinceToRegion: Record<string, string> = {
  // Galicia
  "A Coruña": "Galicia",
  "Lugo": "Galicia",
  "Ourense": "Galicia",
  "Pontevedra": "Galicia",
  // Asturias
  "Asturias": "Principado de Asturias",
  // Cantabria
  "Cantabria": "Cantabria",
  // País Vasco
  "Vizcaya": "País Vasco",
  "Guipúzcoa": "País Vasco",
  "Álava": "País Vasco",
  // Navarra
  "Navarra": "Comunidad Foral de Navarra",
  // La Rioja
  "La Rioja": "La Rioja",
  // Aragón
  "Zaragoza": "Aragón",
  "Huesca": "Aragón",
  "Teruel": "Aragón",
  // Cataluña
  "Barcelona": "Cataluña",
  "Girona": "Cataluña",
  "Lleida": "Cataluña",
  "Tarragona": "Cataluña",
  // Castilla y León
  "León": "Castilla y León",
  "Palencia": "Castilla y León",
  "Burgos": "Castilla y León",
  "Zamora": "Castilla y León",
  "Valladolid": "Castilla y León",
  "Soria": "Castilla y León",
  "Segovia": "Castilla y León",
  "Ávila": "Castilla y León",
  "Salamanca": "Castilla y León",
  // Madrid
  "Madrid": "Comunidad de Madrid",
  // Castilla-La Mancha
  "Toledo": "Castilla-La Mancha",
  "Ciudad Real": "Castilla-La Mancha",
  "Cuenca": "Castilla-La Mancha",
  "Guadalajara": "Castilla-La Mancha",
  "Albacete": "Castilla-La Mancha",
  // Extremadura
  "Cáceres": "Extremadura",
  "Badajoz": "Extremadura",
  // Comunidad Valenciana
  "Valencia": "Comunitat Valenciana",
  "Alicante": "Comunitat Valenciana",
  "Castellón": "Comunitat Valenciana",
  // Murcia
  "Murcia": "Región de Murcia",
  // Andalucía
  "Sevilla": "Andalucía",
  "Huelva": "Andalucía",
  "Cádiz": "Andalucía",
  "Málaga": "Andalucía",
  "Córdoba": "Andalucía",
  "Jaén": "Andalucía",
  "Granada": "Andalucía",
  "Almería": "Andalucía",
  // Islas Baleares
  "Islas Baleares": "Illes Balears",
  // Canarias
  "Las Palmas": "Canarias",
  "Santa Cruz de Tenerife": "Canarias",
  // Ceuta y Melilla
  "Ceuta": "Ceuta",
  "Melilla": "Melilla",
};

// Display names for regions
const regionDisplayNames: Record<string, string> = {
  "Galicia": "Galicia",
  "Principado de Asturias": "Asturias",
  "Cantabria": "Cantabria",
  "País Vasco": "País Vasco",
  "Comunidad Foral de Navarra": "Navarra",
  "La Rioja": "La Rioja",
  "Aragón": "Aragón",
  "Cataluña": "Cataluña",
  "Castilla y León": "Castilla y León",
  "Comunidad de Madrid": "Madrid",
  "Castilla-La Mancha": "Castilla-La Mancha",
  "Extremadura": "Extremadura",
  "Comunitat Valenciana": "C. Valenciana",
  "Región de Murcia": "Murcia",
  "Andalucía": "Andalucía",
  "Illes Balears": "Islas Baleares",
  "Canarias": "Canarias",
  "Ceuta": "Ceuta",
  "Melilla": "Melilla",
};

function getColorForValue(value: number, maxValue: number): string {
  if (value === 0) return "#e5e7eb"; // gray-200
  const intensity = Math.min(value / Math.max(maxValue, 1), 1);
  if (intensity < 0.25) return "#fecaca"; // red-200
  if (intensity < 0.5) return "#fca5a5"; // red-300
  if (intensity < 0.75) return "#f87171"; // red-400
  return "#ef4444"; // red-500
}

// Lazy load the map component to avoid SSR issues
const MapComponent = dynamic(
  () => import("./spain-map-leaflet").then((mod) => mod.SpainMapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[450px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-gray-400 flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-[#BB292A] rounded-full animate-spin"></div>
          <span>Cargando mapa...</span>
        </div>
      </div>
    ),
  }
);

export const SpainMap = memo(function SpainMap({ data }: SpainMapProps) {
  // Aggregate province data to regions
  const regionData: Record<string, number> = {};
  Object.entries(data).forEach(([province, count]) => {
    const region = provinceToRegion[province];
    if (region) {
      regionData[region] = (regionData[region] || 0) + count;
    }
  });

  // Calculate max for color scaling
  const regionMax = Math.max(...Object.values(regionData), 1);

  return (
    <div className="relative w-full h-full min-h-[450px]">
      <MapComponent
        regionData={regionData}
        regionMax={regionMax}
        getColorForValue={getColorForValue}
        regionDisplayNames={regionDisplayNames}
      />

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 rounded-lg p-3 shadow-lg border border-gray-200 z-[1000]">
        <div className="text-xs font-medium text-gray-700 mb-2">Clientes comisionables</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span className="text-xs text-gray-500">0</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-200"></div>
            <span className="text-xs text-gray-500">Bajo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span className="text-xs text-gray-500">Medio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-500">Alto</span>
          </div>
        </div>
      </div>
    </div>
  );
});
