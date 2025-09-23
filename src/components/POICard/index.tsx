import React from 'react';

export interface POICardProps {
  id: number | string;
  title: string;
  category?: string;
  rating?: number;
  description?: string;
  imageUrl?: string;
  onSave?: () => void;
  onPlan?: () => void;
}

const POICard: React.FC<POICardProps> = ({
  title,
  category,
  rating,
  description,
  imageUrl,
  onSave,
  onPlan,
}) => {
  return (
    <div className="panel p-3 flex gap-3 hover:shadow-soft transition">
      <img
        src={imageUrl || "/placeholder.png"}
        alt={title}
        className="w-18 h-18 min-w-18 min-h-18 object-cover rounded-[var(--radius)]"
        width={72}
        height={72}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-semibold truncate">{title}</h4>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
              {category && <span className="chip">{category}</span>}
              {typeof rating === 'number' && <span>⭐ {rating.toFixed(1)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="btn border border-slate-300" onClick={onSave}>Save</button>
            <button className="btn btn-accent" onClick={onPlan}>Plan</button>
          </div>
        </div>
        {description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  );
};

export default POICard;


