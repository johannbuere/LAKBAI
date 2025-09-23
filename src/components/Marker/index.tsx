'use client';

import React, { useEffect } from 'react';

export interface MarkerProps {
  id: string | number;
  coordinates: [number, number];
  category?: string;
  thumbnailUrl?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

// This component returns an HTML element string usable with Leaflet DivIcon via outer code
export const renderMarkerHtml = (props: MarkerProps) => {
  const borderColor = props.highlighted ? 'var(--accent)' : '#E2E8F0';
  const ring = props.highlighted ? `box-shadow: 0 0 0 3px var(--accent-bg);` : '';
  const img = props.thumbnailUrl || '/placeholder.png';
  return `
    <div style="width:44px;height:44px;border-radius:9999px;border:2px solid ${borderColor};${ring}overflow:hidden;background:#fff">
      <img src="${img}" style="width:100%;height:100%;object-fit:cover" />
    </div>
  `;
};

const Marker: React.FC<MarkerProps> = () => {
  // Placeholder; actual rendering is managed by MapView with Leaflet's DivIcon
  useEffect(() => {}, []);
  return null;
};

export default Marker;


