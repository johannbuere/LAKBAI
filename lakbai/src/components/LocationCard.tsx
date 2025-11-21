import type { POI } from "../lib/poiData";

interface LocationCardProps {
  poi: POI;
  onAddToItinerary: () => void;
  onClose: () => void;
}

export default function LocationCard({ poi, onAddToItinerary, onClose }: LocationCardProps) {
  return (
    <div className="animate-in fade-in slide-in-from-left-2 duration-200">
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden w-64 border border-gray-200">
        {/* Header with close button */}
        <div className="bg-gradient-to-br from-lakbai-green to-lakbai-lime p-3 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors"
          >
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          {/* POI Name in header */}
          <h2 className="text-base font-bold text-white pr-8 leading-tight">{poi.poiName}</h2>
          <div className="mt-1">
            <span className="px-2 py-0.5 bg-white bg-opacity-20 text-white text-xs rounded-full font-medium">
              {poi.theme.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Coordinates */}
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
            <svg 
              className="w-3 h-3 flex-shrink-0 text-lakbai-green" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{poi.lat.toFixed(5)}, {poi.long.toFixed(5)}</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onAddToItinerary}
              className="w-full bg-lakbai-green hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path d="M12 4v16m8-8H4"></path>
              </svg>
              Add to Itinerary
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
