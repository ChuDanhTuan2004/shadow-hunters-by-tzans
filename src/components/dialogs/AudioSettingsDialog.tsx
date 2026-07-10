import React from "react";
import { X, Volume2, VolumeX } from "lucide-react";

interface AudioSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onVolumeChange: (v: number) => void;
}

export default function AudioSettingsDialog({
  isOpen,
  onClose,
  isMuted,
  volume,
  onToggleMute,
  onVolumeChange,
}: AudioSettingsDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl relative text-gray-200 cursor-default"
      >
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-2 text-[#7BA2BE]">
            <Volume2 className="w-5 h-5" />
            <h2 className="text-base font-bold tracking-tight">Cài đặt Âm thanh</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-neutral-500" />
              ) : (
                <Volume2 className="w-5 h-5 text-[#7BA2BE]" />
              )}
              <span className="text-sm font-bold">Âm thanh</span>
            </div>
            <button
              onClick={onToggleMute}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                isMuted ? "bg-neutral-700" : "bg-[#4437ac]"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isMuted ? "translate-x-0.5" : "translate-x-[22px]"
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-400">Âm lượng</span>
              <span className="text-xs font-bold text-[#7BA2BE]">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-neutral-800 accent-[#4437ac] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#4437ac]"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 px-6 py-4 flex justify-end rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-semibold transition-colors shadow-lg cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
