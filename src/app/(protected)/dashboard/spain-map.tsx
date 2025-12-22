"use client";

import { memo, useState } from "react";

interface SpainMapProps {
  data: Record<string, number>;
}

// Mapping from province names to region IDs
const provinceToRegion: Record<string, string> = {
  // Galicia
  "A Coruña": "galicia",
  "Lugo": "galicia",
  "Ourense": "galicia",
  "Pontevedra": "galicia",
  // Asturias
  "Asturias": "asturias",
  // Cantabria
  "Cantabria": "cantabria",
  // País Vasco
  "Vizcaya": "pais_vasco",
  "Guipúzcoa": "pais_vasco",
  "Álava": "pais_vasco",
  // Navarra
  "Navarra": "navarra",
  // La Rioja
  "La Rioja": "rioja",
  // Aragón
  "Zaragoza": "aragon",
  "Huesca": "aragon",
  "Teruel": "aragon",
  // Cataluña
  "Barcelona": "catalunia",
  "Girona": "catalunia",
  "Lleida": "catalunia",
  "Tarragona": "catalunia",
  // Castilla y León
  "León": "castilla_leon",
  "Palencia": "castilla_leon",
  "Burgos": "castilla_leon",
  "Zamora": "castilla_leon",
  "Valladolid": "castilla_leon",
  "Soria": "castilla_leon",
  "Segovia": "castilla_leon",
  "Ávila": "castilla_leon",
  "Salamanca": "castilla_leon",
  // Madrid
  "Madrid": "madrid",
  // Castilla-La Mancha
  "Toledo": "castilla_mancha",
  "Ciudad Real": "castilla_mancha",
  "Cuenca": "castilla_mancha",
  "Guadalajara": "castilla_mancha",
  "Albacete": "castilla_mancha",
  // Extremadura
  "Cáceres": "extremadura",
  "Badajoz": "extremadura",
  // Comunidad Valenciana
  "Valencia": "valencia",
  "Alicante": "valencia",
  "Castellón": "valencia",
  // Murcia
  "Murcia": "murcia",
  // Andalucía
  "Sevilla": "andalucia",
  "Huelva": "andalucia",
  "Cádiz": "andalucia",
  "Málaga": "andalucia",
  "Córdoba": "andalucia",
  "Jaén": "andalucia",
  "Granada": "andalucia",
  "Almería": "andalucia",
  // Islas Baleares
  "Islas Baleares": "baleares",
  // Canarias
  "Las Palmas": "canarias",
  "Santa Cruz de Tenerife": "canarias",
  // Ceuta y Melilla
  "Ceuta": "ceuta",
  "Melilla": "melilla",
};

const regionNames: Record<string, string> = {
  galicia: "Galicia",
  asturias: "Asturias",
  cantabria: "Cantabria",
  pais_vasco: "País Vasco",
  navarra: "Navarra",
  rioja: "La Rioja",
  aragon: "Aragón",
  catalunia: "Cataluña",
  castilla_leon: "Castilla y León",
  madrid: "Madrid",
  castilla_mancha: "Castilla-La Mancha",
  extremadura: "Extremadura",
  valencia: "C. Valenciana",
  murcia: "Murcia",
  andalucia: "Andalucía",
  baleares: "Islas Baleares",
  canarias: "Canarias",
  ceuta: "Ceuta",
  melilla: "Melilla",
};

// Region positions for interactive points (percentage-based for responsiveness)
const regionPositions: Record<string, { top: string; left: string }> = {
  galicia: { top: "18%", left: "8%" },
  asturias: { top: "14%", left: "20%" },
  cantabria: { top: "14%", left: "30%" },
  pais_vasco: { top: "14%", left: "38%" },
  navarra: { top: "18%", left: "46%" },
  rioja: { top: "24%", left: "40%" },
  aragon: { top: "32%", left: "54%" },
  catalunia: { top: "28%", left: "70%" },
  castilla_leon: { top: "30%", left: "24%" },
  madrid: { top: "42%", left: "42%" },
  castilla_mancha: { top: "52%", left: "50%" },
  extremadura: { top: "52%", left: "22%" },
  valencia: { top: "52%", left: "66%" },
  murcia: { top: "66%", left: "60%" },
  andalucia: { top: "74%", left: "36%" },
  baleares: { top: "50%", left: "86%" },
  canarias: { top: "92%", left: "14%" },
};

function getColorIntensity(value: number, maxValue: number): string {
  if (value === 0) return "bg-gray-300";
  const intensity = Math.min(value / maxValue, 1);
  if (intensity < 0.25) return "bg-red-200";
  if (intensity < 0.5) return "bg-red-300";
  if (intensity < 0.75) return "bg-red-400";
  return "bg-red-500";
}

export const SpainMap = memo(function SpainMap({ data }: SpainMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

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
    <div className="relative w-full h-full min-h-[400px]">
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        .pulse-point::after {
          content: "";
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: inherit;
          animation: pulse-ring 2s ease-out infinite;
        }
      `}</style>

      {/* SVG Map of Spain */}
      <svg
        viewBox="0 0 800 700"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
        </defs>

        {/* Water background */}
        <rect width="800" height="700" fill="url(#waterGradient)" />

        {/* Galicia */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "galicia" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M45,95 L85,75 L115,80 L130,95 L125,120 L140,145 L130,175 L100,185 L70,175 L50,150 L35,125 L45,95 Z"
          onMouseEnter={() => setHoveredRegion("galicia")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Asturias */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "asturias" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M130,95 L180,80 L210,85 L215,105 L195,120 L140,145 L125,120 L130,95 Z"
          onMouseEnter={() => setHoveredRegion("asturias")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Cantabria */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "cantabria" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M210,85 L260,80 L275,95 L265,115 L230,125 L195,120 L215,105 L210,85 Z"
          onMouseEnter={() => setHoveredRegion("cantabria")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* País Vasco */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "pais_vasco" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M260,80 L310,75 L335,90 L330,115 L295,130 L265,115 L275,95 L260,80 Z"
          onMouseEnter={() => setHoveredRegion("pais_vasco")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Navarra */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "navarra" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M335,90 L385,85 L400,110 L390,145 L350,160 L320,145 L330,115 L335,90 Z"
          onMouseEnter={() => setHoveredRegion("navarra")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* La Rioja */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "rioja" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M295,130 L330,115 L320,145 L350,160 L340,185 L295,195 L275,175 L280,150 L295,130 Z"
          onMouseEnter={() => setHoveredRegion("rioja")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Aragón */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "aragon" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M385,85 L450,80 L480,120 L490,180 L475,250 L450,310 L400,340 L370,300 L360,240 L350,160 L390,145 L400,110 L385,85 Z"
          onMouseEnter={() => setHoveredRegion("aragon")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Cataluña */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "catalunia" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M450,80 L520,60 L580,90 L600,140 L590,200 L560,250 L510,280 L475,250 L490,180 L480,120 L450,80 Z"
          onMouseEnter={() => setHoveredRegion("catalunia")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Castilla y León */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "castilla_leon" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M100,185 L130,175 L140,145 L195,120 L230,125 L265,115 L295,130 L280,150 L275,175 L295,195 L340,185 L350,160 L360,240 L340,290 L300,320 L250,330 L200,310 L150,290 L120,260 L90,230 L100,185 Z"
          onMouseEnter={() => setHoveredRegion("castilla_leon")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Madrid */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "madrid" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M300,320 L340,290 L360,310 L370,340 L355,365 L320,370 L295,355 L300,320 Z"
          onMouseEnter={() => setHoveredRegion("madrid")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Castilla-La Mancha */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "castilla_mancha" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M360,310 L370,300 L400,340 L450,370 L480,420 L470,470 L420,490 L360,480 L310,460 L280,420 L270,380 L295,355 L320,370 L355,365 L370,340 L360,310 Z"
          onMouseEnter={() => setHoveredRegion("castilla_mancha")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Extremadura */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "extremadura" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M90,310 L150,290 L200,310 L250,330 L270,380 L280,420 L260,470 L210,490 L150,480 L100,450 L80,400 L75,350 L90,310 Z"
          onMouseEnter={() => setHoveredRegion("extremadura")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Comunidad Valenciana */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "valencia" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M450,310 L475,250 L510,280 L540,320 L555,380 L540,440 L510,470 L470,470 L480,420 L450,370 L450,310 Z"
          onMouseEnter={() => setHoveredRegion("valencia")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Murcia */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "murcia" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M470,470 L510,470 L540,490 L530,530 L490,545 L450,530 L440,500 L470,470 Z"
          onMouseEnter={() => setHoveredRegion("murcia")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Andalucía */}
        <path
          className={`transition-all duration-200 cursor-pointer ${
            hoveredRegion === "andalucia" ? "fill-red-200" : "fill-gray-100"
          }`}
          stroke="#9ca3af"
          strokeWidth="1"
          d="M100,450 L150,480 L210,490 L260,470 L280,420 L310,460 L360,480 L420,490 L440,500 L450,530 L430,570 L380,600 L300,620 L220,610 L150,580 L100,550 L70,510 L80,480 L100,450 Z"
          onMouseEnter={() => setHoveredRegion("andalucia")}
          onMouseLeave={() => setHoveredRegion(null)}
        />

        {/* Islas Baleares */}
        <g>
          {/* Mallorca */}
          <path
            className={`transition-all duration-200 cursor-pointer ${
              hoveredRegion === "baleares" ? "fill-red-200" : "fill-gray-100"
            }`}
            stroke="#9ca3af"
            strokeWidth="1"
            d="M680,320 L720,310 L745,330 L750,360 L730,385 L695,390 L670,370 L665,340 L680,320 Z"
            onMouseEnter={() => setHoveredRegion("baleares")}
            onMouseLeave={() => setHoveredRegion(null)}
          />
          {/* Menorca */}
          <path
            className={`transition-all duration-200 cursor-pointer ${
              hoveredRegion === "baleares" ? "fill-red-200" : "fill-gray-100"
            }`}
            stroke="#9ca3af"
            strokeWidth="1"
            d="M760,290 L785,285 L795,300 L785,315 L760,310 L755,295 L760,290 Z"
            onMouseEnter={() => setHoveredRegion("baleares")}
            onMouseLeave={() => setHoveredRegion(null)}
          />
          {/* Ibiza */}
          <path
            className={`transition-all duration-200 cursor-pointer ${
              hoveredRegion === "baleares" ? "fill-red-200" : "fill-gray-100"
            }`}
            stroke="#9ca3af"
            strokeWidth="1"
            d="M630,390 L650,385 L660,400 L650,415 L630,410 L625,395 L630,390 Z"
            onMouseEnter={() => setHoveredRegion("baleares")}
            onMouseLeave={() => setHoveredRegion(null)}
          />
        </g>

        {/* Canarias (in box at bottom) */}
        <g>
          {/* Box for Canarias */}
          <rect x="30" y="630" width="220" height="60" fill="none" stroke="#9ca3af" strokeWidth="1" strokeDasharray="4" />
          <text x="140" y="680" textAnchor="middle" className="text-[10px] fill-gray-400">Islas Canarias</text>

          {/* Tenerife */}
          <path
            className={`transition-all duration-200 cursor-pointer ${
              hoveredRegion === "canarias" ? "fill-red-200" : "fill-gray-100"
            }`}
            stroke="#9ca3af"
            strokeWidth="1"
            d="M60,645 L85,640 L100,650 L95,665 L70,670 L55,660 L60,645 Z"
            onMouseEnter={() => setHoveredRegion("canarias")}
            onMouseLeave={() => setHoveredRegion(null)}
          />
          {/* Gran Canaria */}
          <path
            className={`transition-all duration-200 cursor-pointer ${
              hoveredRegion === "canarias" ? "fill-red-200" : "fill-gray-100"
            }`}
            stroke="#9ca3af"
            strokeWidth="1"
            d="M130,645 L155,640 L165,655 L155,670 L130,670 L120,655 L130,645 Z"
            onMouseEnter={() => setHoveredRegion("canarias")}
            onMouseLeave={() => setHoveredRegion(null)}
          />
          {/* Lanzarote */}
          <path
            className={`transition-all duration-200 cursor-pointer ${
              hoveredRegion === "canarias" ? "fill-red-200" : "fill-gray-100"
            }`}
            stroke="#9ca3af"
            strokeWidth="1"
            d="M190,645 L210,642 L218,655 L210,668 L190,665 L185,655 L190,645 Z"
            onMouseEnter={() => setHoveredRegion("canarias")}
            onMouseLeave={() => setHoveredRegion(null)}
          />
        </g>

        {/* Region labels */}
        {Object.entries(regionPositions).map(([regionId, position]) => {
          const count = regionData[regionId] || 0;
          if (count === 0) return null;

          // Convert percentage to pixel coordinates
          const left = (parseFloat(position.left) / 100) * 800;
          const top = (parseFloat(position.top) / 100) * 700;

          return (
            <g key={`label-${regionId}`}>
              <circle
                cx={left}
                cy={top}
                r={Math.min(Math.max(count / 2, 8), 20)}
                className={`${getColorIntensity(count, regionMax).replace("bg-", "fill-")}`}
                stroke="white"
                strokeWidth="2"
              />
              <text
                x={left}
                y={top + 4}
                textAnchor="middle"
                className="text-[10px] font-bold fill-white"
              >
                {count}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredRegion && regionData[hoveredRegion] !== undefined && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10 border border-gray-200">
          <div className="font-semibold text-gray-900">{regionNames[hoveredRegion]}</div>
          <div className="text-sm text-gray-600">
            {regionData[hoveredRegion] || 0} cliente{(regionData[hoveredRegion] || 0) !== 1 ? "s" : ""} comisionable{(regionData[hoveredRegion] || 0) !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/95 rounded-lg p-3 shadow-lg border border-gray-200">
        <div className="text-xs font-medium text-gray-700 mb-2">Clientes comisionables</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
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
