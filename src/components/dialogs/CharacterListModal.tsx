import React from "react";
import { X, Swords, Shield, Heart, Sparkles } from "lucide-react";
import { CHARACTERS } from "../../data/cards";
import { Alignment } from "../../types";

interface CharacterListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CharacterListModal({ isOpen, onClose }: CharacterListModalProps) {
  if (!isOpen) return null;

  const shadowChars = CHARACTERS.filter(c => c.alignment === Alignment.SHADOW);
  const hunterChars = CHARACTERS.filter(c => c.alignment === Alignment.HUNTER);
  const neutralChars = CHARACTERS.filter(c => c.alignment === Alignment.NEUTRAL);

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
            <h2 className="text-xl font-bold font-sans tracking-tight">Danh sách nhân vật</h2>
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
          {/* Phe Shadow */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-red-400 border-l-2 border-red-500 pl-3 flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Phe Shadow (Bóng Tối)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shadowChars.map((char, idx) => (
                <div key={idx} className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{char.name}</h4>
                    <span className="flex items-center gap-1 text-[10px] text-red-300 font-semibold">
                      <Heart className="w-3 h-3" />
                      {char.hp} HP
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-rose-300 font-medium">
                      <Sparkles className="w-3 h-3" />
                      {char.abilityName}
                    </div>
                    <p className="text-neutral-300 leading-relaxed">{char.abilityDesc}</p>
                    <p className="text-neutral-400 italic text-[10px] border-t border-red-900/20 pt-1 mt-1">
                      🎯 {char.winCondition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Phe Hunter */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-blue-400 border-l-2 border-blue-500 pl-3 flex items-center gap-2">
              <Swords className="w-4 h-4" />
              Phe Hunter (Thợ Săn)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hunterChars.map((char, idx) => (
                <div key={idx} className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{char.name}</h4>
                    <span className="flex items-center gap-1 text-[10px] text-blue-300 font-semibold">
                      <Heart className="w-3 h-3" />
                      {char.hp} HP
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-blue-300 font-medium">
                      <Sparkles className="w-3 h-3" />
                      {char.abilityName}
                    </div>
                    <p className="text-neutral-300 leading-relaxed">{char.abilityDesc}</p>
                    <p className="text-neutral-400 italic text-[10px] border-t border-blue-900/20 pt-1 mt-1">
                      🎯 {char.winCondition}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Phe Neutral */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-amber-400 border-l-2 border-amber-500 pl-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Phe Neutral (Trung Lập)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {neutralChars.map((char, idx) => (
                <div key={idx} className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{char.name}</h4>
                    <span className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
                      <Heart className="w-3 h-3" />
                      {char.hp} HP
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1 text-amber-300 font-medium">
                      <Sparkles className="w-3 h-3" />
                      {char.abilityName}
                    </div>
                    <p className="text-neutral-300 leading-relaxed">{char.abilityDesc}</p>
                    <p className="text-neutral-400 italic text-[10px] border-t border-amber-900/20 pt-1 mt-1">
                      🎯 {char.winCondition}
                    </p>
                  </div>
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
