import { useState } from "react";

export function AIRecommendations() {
  const [isExpanded, setIsExpanded] = useState(false);

  const recommendations = [
    { id: 1, name: "SM Legazpi City", theme: "Mall" },
    { id: 2, name: "SM Legazpi City", theme: "Mall" },
    { id: 3, name: "SM Legazpi City", theme: "Mall" },
  ];

  return (
    <div className="w-[360px] relative">
      <div className="absolute inset-0 top-[14px] rounded-[20px] bg-lakbai-green-dark shadow-[0_4px_7.6px_5px_rgba(0,0,0,0.25)_inset]" />

      <div className="relative z-10">
        <div className="h-[49px] rounded-[21px] bg-lakbai-green-dark shadow-[0_4px_4px_0_rgba(0,0,0,0.25)_inset,0_4px_4px_0_rgba(0,0,0,0.25)] flex items-center justify-between px-6">
          <div>
            <h3 className="font-stack text-[11px] font-semibold text-white">
              ai recommendations
            </h3>
            <p className="font-stack text-[11px] font-extralight text-white">
              See what everybody wants to visit!
            </p>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="transition-transform"
            style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 23 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.5 3.83334V19.1667M11.5 19.1667L17.25 13.4167M11.5 19.1667L5.75 13.4167"
                stroke="white"
                strokeWidth="1.4375"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {isExpanded && (
          <div className="px-6 pb-6 pt-4">
            <p className="font-stack text-[11px] font-normal text-white mb-3">
              lakbai recommends the following:
            </p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-white font-stack text-[11px] font-extralight">
                <span>Locations</span>
                <span>Theme</span>
              </div>

              {recommendations.map((rec) => (
                <div key={rec.id} className="flex items-center gap-3">
                  <div className="w-4 h-[15px] rounded-sm bg-white flex items-center justify-center">
                    <span className="font-stack text-[11px] font-semibold text-lakbai-green-light">
                      {rec.id}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center justify-between">
                    <span className="font-stack text-[11px] font-semibold text-white">
                      {rec.name}
                    </span>
                    <span className="font-stack text-[11px] font-light text-white">
                      {rec.theme}
                    </span>
                  </div>

                  <button className="hover:opacity-80 transition-opacity">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.00001 1.33333C4.31801 1.33333 1.33334 4.31799 1.33334 7.99999C1.33334 11.682 4.31801 14.6667 8.00001 14.6667C11.682 14.6667 14.6667 11.682 14.6667 7.99999C14.6667 4.31799 11.682 1.33333 8.00001 1.33333ZM11.3333 8.66666H8.66668V11.3333H7.33334V8.66666H4.66668V7.33333H7.33334V4.66666H8.66668V7.33333H11.3333V8.66666Z"
                        fill="white"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button
              className="mt-4 mx-auto flex items-center gap-1"
              onClick={() => setIsExpanded(false)}
            >
              <span className="font-stack text-[9px] font-semibold text-white">
                See More
              </span>
              <svg
                className="w-[10px] h-[10px]"
                viewBox="0 0 10 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.11917 2.30668C9.08388 2.2393 9.03082 2.18287 8.96575 2.1435C8.90067 2.10414 8.82606 2.08333 8.75 2.08334H1.25C1.17411 2.08366 1.09973 2.10465 1.03487 2.14408C0.970014 2.1835 0.91713 2.23986 0.881908 2.30709C0.846685 2.37432 0.830456 2.44988 0.834966 2.52565C0.839476 2.60141 0.864555 2.67452 0.907504 2.73709L4.6575 8.15376C4.69573 8.20928 4.74688 8.25467 4.80654 8.28603C4.86621 8.31739 4.9326 8.33377 5 8.33377C5.06741 8.33377 5.1338 8.31739 5.19347 8.28603C5.25313 8.25467 5.30428 8.20928 5.3425 8.15376L9.0925 2.73709C9.13579 2.67461 9.16115 2.60147 9.16585 2.5256C9.17055 2.44974 9.15441 2.37403 9.11917 2.30668ZM5 7.18459L2.045 2.91668H7.955L5 7.18459Z"
                  fill="white"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
