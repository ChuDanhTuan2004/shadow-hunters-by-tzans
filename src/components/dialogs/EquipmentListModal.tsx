import React from "react";
import { X, Shield } from "lucide-react";
import { DECK_LIGHT, DECK_SHADOW } from "../../data/cards";
import { CardType } from "../../types";

interface EquipmentListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EquipmentListModal({ isOpen, onClose }: EquipmentListModalProps) {
  if (!isOpen) return null;

  const lightEquipment = DECK_LIGHT.filter(c => c.isEquipment);
  const shadowEquipment = DECK_SHADOW.filter(c => c.isEquipment);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl relative text-gray-200 cursor-default"
      >
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-rose-500">
            <Shield className="w-6 h-6" />
            <h2 className="text-xl font-bold font-sans tracking-tight">Danh Sách Trang Bị</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 font-sans">
          {/* Trang bị Ánh Sáng */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-400 border-l-2 border-blue-500 pl-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Trang Bị Ánh Sáng (Light)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lightEquipment.map((card) => (
                <div key={card.id} className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-white">{card.name}</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">{card.description}</p>
                  <p className="text-[10px] text-blue-300 font-medium border-t border-blue-900/20 pt-1 mt-1">
                    {card.effectText}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Trang bị Bóng Tối */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-orange-400 border-l-2 border-orange-500 pl-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Trang Bị Bóng Tối (Shadow)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shadowEquipment.map((card) => (
                <div key={card.id} className="bg-orange-950/20 border border-orange-900/30 rounded-xl p-4 space-y-2">
                  <h4 className="text-sm font-bold text-white">{card.name}</h4>
                  <p className="text-xs text-neutral-300 leading-relaxed">{card.description}</p>
                  <p className="text-[10px] text-orange-300 font-medium border-t border-orange-900/20 pt-1 mt-1">
                    {card.effectText}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-semibold transition-colors shadow-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
