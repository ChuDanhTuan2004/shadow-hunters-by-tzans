import React from "react";
import { GameLog } from "../../types";
import GameLogs from "../GameLogs";

interface HistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  logs: GameLog[];
}

export default function HistoryDialog({ isOpen, onClose, logs }: HistoryDialogProps) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-950 border border-neutral-800 rounded-3xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden cursor-default"
      >
        <div className="p-4 border-b border-neutral-900 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nhật Ký Trận Đấu</h3>
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-850 transition-colors border border-neutral-800 cursor-pointer"
          >
            Đóng
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 max-h-[65vh]">
          <GameLogs logs={logs} />
        </div>
      </div>
    </div>
  );
}
