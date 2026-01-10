"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface SpainMapLeafletProps {
  regionData: Record<string, number>;
  regionMax: number;
  getColorForValue: (value: number, maxValue: number) => string;
  regionDisplayNames: Record<string, string>;
}

// GeoJSON URL for Spanish autonomous communities
const SPAIN_GEOJSON_URL = "https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/spain-communities.geojson";

export function SpainMapLeaflet({
  regionData,
  regionMax,
  getColorForValue,
  regionDisplayNames,
}: SpainMapLeafletProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredRegion, setHoveredRegion] = useState<{ name: string; count: number } | null>(null);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Fetch GeoJSON data
  useEffect(() => {
    fetch(SPAIN_GEOJSON_URL)
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error("Error loading Spain GeoJSON:", err));
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Create map centered on Spain
    const map = L.map(containerRef.current, {
      center: [40.0, -3.7],
      zoom: 5.5,
      zoomControl: true,
      scrollWheelZoom: false,
      doubleClickZoom: true,
      dragging: true,
      attributionControl: false,
    });

    // Add a subtle tile layer (light style)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add GeoJSON layer when data is loaded
  useEffect(() => {
    if (!mapRef.current || !geoJsonData) return;

    // Remove previous layer if exists
    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current);
    }

    const geoJsonLayer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const regionName = feature?.properties?.name || "";
        const count = regionData[regionName] || 0;
        const fillColor = getColorForValue(count, regionMax);

        return {
          fillColor,
          weight: 1.5,
          opacity: 1,
          color: "#ffffff",
          fillOpacity: 0.8,
        };
      },
      onEachFeature: (feature, layer) => {
        const regionName = feature.properties?.name || "";
        const displayName = regionDisplayNames[regionName] || regionName;
        const count = regionData[regionName] || 0;

        layer.on({
          mouseover: (e) => {
            const layer = e.target;
            layer.setStyle({
              weight: 3,
              color: "#BB292A",
              fillOpacity: 0.9,
            });
            layer.bringToFront();
            setHoveredRegion({ name: displayName, count });
          },
          mouseout: (e) => {
            geoJsonLayer.resetStyle(e.target);
            setHoveredRegion(null);
          },
          click: () => {
            // Could add click functionality here
          },
        });

        // Add tooltip
        layer.bindTooltip(
          `<strong>${displayName}</strong><br/>${count} cliente${count !== 1 ? "s" : ""} comisionable${count !== 1 ? "s" : ""}`,
          {
            permanent: false,
            direction: "center",
            className: "spain-map-tooltip",
          }
        );
      },
    }).addTo(mapRef.current);

    geoJsonLayerRef.current = geoJsonLayer;

    // Fit bounds to Spain
    mapRef.current.fitBounds(geoJsonLayer.getBounds(), {
      padding: [20, 20],
    });
  }, [geoJsonData, regionData, regionMax, getColorForValue, regionDisplayNames]);

  return (
    <>
      <style jsx global>{`
        .spain-map-tooltip {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
        }
        .spain-map-tooltip strong {
          color: #111827;
        }
        .leaflet-container {
          background: #f0f9ff;
          border-radius: 8px;
        }
      `}</style>
      <div
        ref={containerRef}
        className="w-full h-[450px] rounded-lg overflow-hidden"
      />
    </>
  );
}
