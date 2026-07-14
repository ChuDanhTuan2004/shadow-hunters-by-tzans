import React from "react";
import { Heart, Sparkles, Shield, Check, Clock, ArrowLeft } from "lucide-react";
import { GameState, Alignment } from "../types";
import { CHARACTERS } from "../data/cards";

const bgPc = "/assets/images/bg/bg-pc-compressed.png";
const bgMobile = "/assets/images/bg/bg-mobile-compressed.png";

interface CharacterSelectProps {
  activeGame: GameState;
  playerId: string;
  onConfirmCharacter: (characterName: string) => void;
  onLeave: () => void;
}

const alignmentStyles: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  red: {
    bg: "bg-red-950/20",
    border: "border-red-900/30",
    text: "text-red-300",
    badge: "bg-red-950/30 border-red-700/40 text-red-300"
  },
  blue: {
    bg: "bg-blue-950/20",
    border: "border-blue-900/30",
    text: "text-blue-300",
    badge: "bg-blue-950/30 border-blue-700/40 text-blue-300"
  },
  amber: {
    bg: "bg-amber-950/20",
    border: "border-amber-900/30",
    text: "text-amber-300",
    badge: "bg-amber-950/30 border-amber-700/40 text-amber-300"
  }
};

export default function CharacterSelect({
  activeGame,
  playerId,
  onConfirmCharacter,
  onLeave
}: CharacterSelectProps) {
  const currentPlayer = activeGame.players.find(p => p.id === playerId);
  const isHost = (activeGame.hostId || activeGame.players[0]?.id) === playerId;
  const options = currentPlayer?.characterOptions || [];
  const hasChosen = currentPlayer?.characterChoice !== null && currentPlayer?.characterChoice !== undefined;

  const totalPlayers = activeGame.players.length;
  const chosenCount = activeGame.players.filter(p => p.characterChoice !== null && p.characterChoice !== undefined).length;

  const getCharacter = (name: string) => CHARACTERS.find(c => c.name === name);

  return (
    <div className="relative w-full z-10 flex flex-col items-center">
      {/* BACKGROUND */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        <div
          className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${bgPc})` }}
        />
        <div
          className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${bgMobile})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#07080f]/98 via-[#13112d]/93 to-[#261f5c]/85 mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(68,55,172,0.15)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/70" />
      </div>

      <div className="max-w-2xl w-full mx-auto bg-[#0a0c16]/85 backdrop-blur-xl border border-[#4437ac]/40 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(68,55,172,0.3)] p-6 sm:p-8 space-y-6 animate-fadeIn relative z-10">
        <div className="text-center space-y-2.5">
          <span className="text-[10px] bg-[#4437ac]/20 text-[#7ba2be] border border-[#4437ac]/40 px-3 py-1 rounded-full font-bold uppercase tracking-widest inline-block">
            Chọn Nhân Vật
          </span>
          <h2 className="text-2xl font-extrabold tracking-widest text-white">
            {hasChosen ? "Đã Chọn Nhân Vật" : "Hãy Chọn 1 Trong 2 Nhân Vật"}
          </h2>
          <p className="text-xs text-neutral-300 max-w-md mx-auto leading-relaxed">
            {hasChosen
              ? `Đang chờ người chơi khác... (${chosenCount}/${totalPlayers})`
              : "Mỗi người chơi sẽ được rút 2 nhân vật ngẫu nhiên và chọn 1 để nhập cuộc."}
          </p>
        </div>

        {/* Thanh tiến trình */}
        <div className="bg-[#030408]/50 rounded-xl p-4 border border-[#4437ac]/25">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Tiến trình chọn nhân vật</span>
            <span className="font-bold text-[#7ba2be]">{chosenCount}/{totalPlayers}</span>
          </div>
          <div className="h-2 bg-[#030408] rounded-full overflow-hidden border border-[#4437ac]/20">
            <div
              className="h-full bg-gradient-to-r from-[#4437ac] to-[#7ba2be] rounded-full transition-all duration-500"
              style={{ width: `${totalPlayers > 0 ? (chosenCount / totalPlayers) * 100 : 0}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {activeGame.players.map(p => {
              const didChoose = p.characterChoice !== null && p.characterChoice !== undefined;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                    didChoose
                      ? "bg-emerald-950/30 border-emerald-700/40 text-emerald-300"
                      : "bg-neutral-900/50 border-neutral-800/40 text-neutral-500"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name.length > 12 ? p.name.slice(0, 12) + "..." : p.name}
                  {didChoose && <Check className="w-3 h-3 ml-0.5" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2 lựa chọn nhân vật */}
        {!hasChosen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {options.map((charName, idx) => {
              const char = getCharacter(charName);
              if (!char) return null;

              const alignmentKey =
                char.alignment === Alignment.SHADOW
                  ? "red"
                  : char.alignment === Alignment.HUNTER
                  ? "blue"
                  : "amber";

              const style = alignmentStyles[alignmentKey];

              return (
                <button
                  key={idx}
                  onClick={() => onConfirmCharacter(charName)}
                  className={`${style.bg} ${style.border} rounded-xl p-5 space-y-3 text-left hover:scale-[1.02] transition-all cursor-pointer active:scale-[0.98] shadow-lg hover:shadow-xl`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">{char.name}</h3>
                    <span className={`flex items-center gap-1 text-[11px] ${style.text} font-semibold`}>
                      <Heart className="w-3.5 h-3.5" />
                      {char.hp} HP
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className={`flex items-center gap-1.5 ${style.text} font-medium`}>
                      <Sparkles className="w-3.5 h-3.5" />
                      {char.abilityName}
                    </div>
                    <p className="text-neutral-300 leading-relaxed text-[11px]">
                      {char.abilityDesc}
                    </p>
                    <p className="text-neutral-500 italic text-[10px] border-t border-neutral-800 pt-2 mt-2">
                      🎯 {char.winCondition}
                    </p>
                  </div>
                  <div className="w-full py-2.5 bg-gradient-to-r from-[#4437ac] to-[#5b4fcd] hover:from-[#5b4fcd] hover:to-[#7ba2be] rounded-xl text-xs font-bold text-white text-center transition-all shadow-lg">
                    Chọn Nhân Vật Này
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Đã chọn - chờ người khác */}
        {hasChosen && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <Clock className="w-16 h-16 text-[#7ba2be] animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <p className="text-sm text-neutral-300 text-center max-w-sm">
              Bạn đã chọn <span className="font-bold text-white">{currentPlayer?.characterChoice}</span>.
              Đang chờ những người chơi còn lại chọn nhân vật...
            </p>
          </div>
        )}

        {/* Nút Hủy phòng / Thoát phòng */}
        <div className="flex justify-center pt-4 border-t border-white/5">
          <button
            onClick={onLeave}
            className="px-6 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-bold text-neutral-300 rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            {isHost ? "Hủy Phòng" : "Thoát Phòng"}
          </button>
        </div>
      </div>
    </div>
  );
}