import React from "react";
import { CardType } from "../../types";
import { GameCard } from "../../data/cards";
import { X, Sparkles } from "lucide-react";

interface CardDetailModalProps {
  card: GameCard | null;
  onClose: () => void;
}

export default function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  if (!card) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-sm shadow-2xl relative space-y-4 overflow-hidden"
      >
        <div
          className={`absolute top-0 left-0 w-full h-1.5 ${
            card.type === CardType.HERMIT
              ? "bg-emerald-500"
              : card.type === CardType.LIGHT
                ? "bg-blue-500"
                : "bg-orange-500"
          }`}
        />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1 pt-2">
          <span
            className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest border ${
              card.type === CardType.HERMIT
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/40"
                : card.type === CardType.LIGHT
                  ? "bg-blue-950/40 text-blue-400 border-blue-900/40"
                  : "bg-orange-950/40 text-orange-400 border-orange-900/40"
            }`}
          >
            {card.type === CardType.HERMIT
              ? "Bộ Bài Ẩn Sĩ (Hermit)"
              : card.type === CardType.LIGHT
                ? "Bộ Bài Ánh Sáng (Light)"
                : "Bộ Bài Bóng Tối (Shadow)"}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight pt-1">
            {card.name}
          </h3>
          <p className="text-[10px] text-neutral-500">
            {card.isEquipment ? "🛡️ Thẻ Trang Bị Hộ Thân" : "⚡ Thẻ Vật Phẩm Một Lần"}
          </p>
        </div>

        <div className="bg-neutral-900/60 rounded-2xl border border-neutral-900 p-4 space-y-3.5">
          <div className="space-y-1">
            <span className="text-[9px] text-neutral-500 block font-semibold uppercase tracking-wider">
              Mô tả thẻ bài:
            </span>
            <p className="text-xs text-neutral-200 leading-relaxed font-medium">
              {card.description}
            </p>
          </div>

          <div className="space-y-1 border-t border-neutral-800 pt-3">
            <span className="text-[9px] text-rose-400 font-bold block uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Hiệu ứng kích hoạt:
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {card.effectText}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-300 hover:text-white transition-all shadow"
        >
          ĐÓNG CỬA SỔ
        </button>
      </div>
    </div>
  );
}
