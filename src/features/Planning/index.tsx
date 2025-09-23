'use client';

import React from 'react';
import POICard from '@/components/POICard';
import type { POI } from '@/lib/api';

export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: 'start' | 'destination' | 'waypoint';
  estimatedTime?: number;
  notes?: string;
}

interface PlanningProps {
  pois: POI[];
  selectedPOIs: POI[];
  routePoints: RoutePoint[];
  onAdd: (poi: POI) => void;
  onRemove: (poiId: number) => void;
  onCalculate: () => void;
  onSave: () => void;
  transportMode: 'driving' | 'cycling' | 'walking';
  setTransportMode: (m: 'driving' | 'cycling' | 'walking') => void;
  tripDuration: number;
  setTripDuration: (n: number) => void;
}

const Planning: React.FC<PlanningProps> = ({
  pois,
  selectedPOIs,
  routePoints,
  onAdd,
  onRemove,
  onCalculate,
  onSave,
  transportMode,
  setTransportMode,
  tripDuration,
  setTripDuration,
}) => {
  return (
    <div className="w-full h-full overflow-y-auto p-6 bg-[var(--bg)]">
      <h1 className="text-2xl font-bold mb-4">Plan Your Trip</h1>

      <div className="panel p-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Duration (hours)</label>
            <input
              type="number"
              value={tripDuration}
              min={1}
              max={12}
              onChange={(e) => setTripDuration(Number(e.target.value))}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Transport</label>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as any)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="driving">Driving</option>
              <option value="cycling">Cycling</option>
              <option value="walking">Walking</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Your Route</h3>
        {routePoints.length === 0 ? (
          <div className="panel p-6 text-center text-slate-600">
            Click a marker or search to start planning.
          </div>
        ) : (
          <div className="space-y-3">
            {routePoints.map((point, index) => (
              <div key={point.id} className="panel p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-bg)] text-[var(--accent)] flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{point.name}</div>
                  <div className="text-sm text-slate-600">
                    {point.type}
                    {point.estimatedTime && ` • ${point.estimatedTime} min`}
                  </div>
                </div>
                {point.type === 'waypoint' && (
                  <button className="text-red-600" onClick={() => onRemove(Number(point.id.split('-')[1]))}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button className="btn btn-accent flex-1" onClick={onCalculate}>Calculate Route</button>
        <button className="btn border border-slate-300 flex-1" onClick={onSave}>Save Route</button>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold mb-3">Quick Add</h3>
        <div className="space-y-3">
          {pois.slice(0, 6).map((p) => (
            <POICard
              key={p.id}
              id={p.id}
              title={p.name}
              category={p.category}
              description={p.description}
              onPlan={() => onAdd(p)}
              onSave={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Planning;


