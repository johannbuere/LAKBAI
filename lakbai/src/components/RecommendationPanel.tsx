import { useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles, MapPin } from 'lucide-react';
import type { Recommendation } from '../lib/recommendationService';

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  onRecommendationClick: (recommendation: Recommendation) => void;
  isLoading?: boolean;
}

export default function RecommendationPanel({ 
  recommendations, 
  onRecommendationClick,
  isLoading = false 
}: RecommendationPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Show only top 3 by default, or up to 10 when expanded
  const displayedRecommendations = showAll 
    ? recommendations.slice(0, 10) 
    : recommendations.slice(0, 3);

  const hasMore = recommendations.length > 3;
  const isEmpty = recommendations.length === 0 && !isLoading;

  return (
    <div className="absolute top-4 left-4 z-[1000] w-96 bg-white rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div 
        className="bg-gradient-to-r from-lakbai-green to-emerald-600 text-white px-4 py-3 flex items-center justify-between cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Recommendations</h3>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
            {recommendations.length} suggestions
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="max-h-[500px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
              <p className="text-sm">Finding personalized recommendations...</p>
            </div>
          ) : isEmpty ? (
            <div className="p-4 text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium mb-1">AI Recommendations Ready!</p>
              <p className="text-xs text-gray-400">Add a location to your itinerary to get personalized suggestions</p>
            </div>
          ) : (
            <>
              {/* Recommendations List */}
              <div className="divide-y divide-gray-100">
                {displayedRecommendations.map((rec, index) => (
                  <button
                    key={rec.poi_id}
                    onClick={() => onRecommendationClick(rec)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Rank Badge */}
                      <div className="flex-shrink-0 w-8 h-8 bg-lakbai-green text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-lakbai-green transition-colors truncate">
                            {rec.name}
                          </h4>
                          <MapPin className="w-4 h-4 text-lakbai-green flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Theme Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {rec.theme}
                          </span>
                          <span className="text-xs text-gray-500">
                            Score: {(rec.score * 100).toFixed(0)}%
                          </span>
                        </div>

                        {/* Reason */}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {rec.reason}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Show More/Less Button */}
              {hasMore && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full p-3 bg-gray-50 hover:bg-gray-100 text-lakbai-green font-medium text-sm transition-colors"
                >
                  {showAll ? (
                    <>
                      Show Less
                      <ChevronUp className="inline-block w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Show More ({Math.min(recommendations.length - 3, 7)} more)
                      <ChevronDown className="inline-block w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              )}

              {/* Footer Info */}
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  💡 Click any suggestion to view details and add to your itinerary
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
