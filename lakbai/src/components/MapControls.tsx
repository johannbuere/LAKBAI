export function MapControls() {
  return (
    <div className="absolute bottom-[100px] right-[40px] flex flex-col gap-2">
      <button className="w-[41px] h-[41px] rounded-[11px] bg-lakbai-gray hover:bg-white transition-colors flex items-center justify-center">
        <svg
          className="w-[35px] h-[35px]"
          viewBox="0 0 35 35"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.9338 8.73867C18.9338 8.3524 18.7803 7.98195 18.5072 7.70881C18.2341 7.43567 17.8636 7.28223 17.4773 7.28223C17.0911 7.28223 16.7206 7.43567 16.4475 7.70881C16.1743 7.98195 16.0209 8.3524 16.0209 8.73867V16.0209H8.73867C8.3524 16.0209 7.98195 16.1743 7.70881 16.4475C7.43567 16.7206 7.28223 17.0911 7.28223 17.4773C7.28223 17.8636 7.43567 18.2341 7.70881 18.5072C7.98195 18.7803 8.3524 18.9338 8.73867 18.9338H16.0209V26.216C16.0209 26.6023 16.1743 26.9728 16.4475 27.2459C16.7206 27.519 17.0911 27.6725 17.4773 27.6725C17.8636 27.6725 18.2341 27.519 18.5072 27.2459C18.7803 26.9728 18.9338 26.6023 18.9338 26.216V18.9338H26.216C26.6023 18.9338 26.9728 18.7803 27.2459 18.5072C27.519 18.2341 27.6725 17.8636 27.6725 17.4773C27.6725 17.0911 27.519 16.7206 27.2459 16.4475C26.9728 16.1743 26.6023 16.0209 26.216 16.0209H18.9338V8.73867Z"
            fill="black"
          />
        </svg>
      </button>

      <button className="w-[41px] h-[41px] rounded-[11px] bg-lakbai-gray hover:bg-white transition-colors flex items-center justify-center">
        <svg
          className="w-[35px] h-[35px]"
          viewBox="0 0 35 35"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.28223 17.4774H27.6725"
            stroke="black"
            strokeWidth="2.91289"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
