"use client";

import { useEffect, useState } from "react";

type Props = {
  message: string;
  onUndo?: () => void;
  onClose: () => void;
};

export default function Toast({
  message,
  onUndo,
  onClose,
}: Props) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => prev - 2);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress <= 0) {
      onClose();
    }
  }, [progress, onClose]);

  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl border border-white/10 flex flex-col gap-2 w-72 animate-slideIn">

      <div className="flex items-center justify-between">
        <span className="text-sm">{message}</span>

        {onUndo && (
          <button
            onClick={onUndo}
            className="text-blue-400 hover:underline text-sm"
          >
            Undo
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded overflow-hidden">
        <div
          className="h-full bg-purple-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}
