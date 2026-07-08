import React from "react";
import { CardType } from "../../types";

interface GateSelectionDialogProps {
  isOpen: boolean;
  onSelect: (deckType: CardType) => void;
}

export default function GateSelectionDialog({ isOpen, onSelect }: GateSelectionDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-5 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4437AC]" />

        <div className="text-center space-y-1">
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
            Cổng Bóng Tối (Underworld Gate)
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight pt-1">
            Rút Một Thẻ Bài Tùy Chọn
          </h3>
          <p className="text-xs text-neutral-400">
            Bạn được phép rút một lá bài bất kỳ từ 1 trong 3 chồng bài thần thoại.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* Hermit */}
          <button
            onClick={() => onSelect(CardType.HERMIT)}
            className="group bg-neutral-900 hover:bg-neutral-900/80 border border-neutral-800 hover:border-emerald-500/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 transition-all cursor-pointer"
          >
            <div className="w-10 h-14 bg-emerald-900/10 border-2 border-dashed border-emerald-500/30 group-hover:border-emerald-500/60 rounded-lg flex items-center justify-center text-emerald-400 font-bold text-sm transition-all">
              ?
            </div>
            <div>
              <h4 className="text-white font-bold text-[11px]">Thẻ Ẩn Sĩ</h4>
              <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">Dò hỏi thân phận đối phương</p>
            </div>
          </button>

          {/* Light */}
          <button
            onClick={() => onSelect(CardType.LIGHT)}
            className="group bg-neutral-900 hover:bg-neutral-900/80 border border-neutral-800 hover:border-blue-500/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 transition-all cursor-pointer"
          >
            <div className="w-10 h-14 bg-blue-900/10 border-2 border-dashed border-blue-500/30 group-hover:border-blue-500/60 rounded-lg flex items-center justify-center text-blue-400 font-bold text-sm transition-all">
              ✨
            </div>
            <div>
              <h4 className="text-white font-bold text-[11px]">Thẻ Ánh Sáng</h4>
              <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">Hồi máu, gia tăng phòng ngự</p>
            </div>
          </button>

          {/* Shadow */}
          <button
            onClick={() => onSelect(CardType.SHADOW)}
            className="group bg-neutral-900 hover:bg-neutral-900/80 border border-neutral-800 hover:border-orange-500/50 p-4 rounded-2xl flex flex-col items-center text-center space-y-3 transition-all cursor-pointer"
          >
            <div className="w-10 h-14 bg-orange-900/10 border-2 border-dashed border-orange-500/30 group-hover:border-orange-500/60 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm transition-all">
              🔥
            </div>
            <div>
              <h4 className="text-white font-bold text-[11px]">Thẻ Bóng Tối</h4>
              <p className="text-[9px] text-neutral-500 mt-0.5 leading-tight">Ma pháp tấn công hỏa lực</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
