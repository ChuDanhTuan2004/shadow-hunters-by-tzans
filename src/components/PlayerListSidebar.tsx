import React from "react";
import { Skull, Bot, User, Shield } from "lucide-react";
import { Alignment, GameState, Player } from "../types";

interface PlayerListSidebarProps {
  activeGame: GameState;
  playerId: string;
  onSelectPlayer: (player: Player) => void;
  mode: "desktop" | "mobile";
}

export default function PlayerListSidebar({
  activeGame,
  playerId,
  onSelectPlayer,
  mode
}: PlayerListSidebarProps) {
  const turnId = activeGame.players[activeGame.turnIndex]?.id;

  if (mode === "mobile") {
    return (
      <div className="lg:hidden w-full overflow-x-auto scrollbar-none py-1 mb-0">
        <div className="flex gap-2 min-w-max px-1">
          {activeGame.players.map((p) => {
            const isSelf = playerId === p.id;
            const isRevealed = isSelf || p.alignmentRevealed || p.isDead;
            const maxHp = p.character.hp;
            const lostHp = maxHp - p.currentHp;
            const isCurrentTurn = p.id === turnId && !p.isDead;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className={`flex flex-col items-center text-center cursor-pointer transition-all duration-300 p-1 rounded-xl border ${
                  isCurrentTurn
                    ? "bg-[#4437AC]/10 border-[#7BA2BE] scale-105 shadow-[0_0_10px_rgba(123,162,190,0.2)]"
                    : "border-transparent hover:bg-neutral-900/40"
                }`}
              >
                {/* Avatar with damage badge */}
                <div className="relative">
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shadow ${
                      p.isDead
                        ? "bg-neutral-800 border-neutral-700 text-neutral-500"
                        : "bg-neutral-900 text-white"
                    }`}
                    style={p.isDead ? {} : { borderColor: p.color }}
                  >
                    {p.isDead ? (
                      <Skull className="w-3.5 h-3.5 text-neutral-500" />
                    ) : p.isBot ? (
                      <Bot className="w-3.5 h-3.5" style={{ color: p.color }} />
                    ) : (
                      <User className="w-3.5 h-3.5" style={{ color: p.color }} />
                    )}
                  </div>
                  {(p.hasGuardianAngel || p.hasGregorShield) && !p.isDead && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <Shield className={`w-3 h-3 drop-shadow-[0_0_4px_rgba(251,191,36,0.6)] ${
                        p.hasGuardianAngel ? "text-amber-400" : "text-cyan-400"
                      }`} />
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-0.5 py-0 rounded text-[7px] font-extrabold border shadow-sm whitespace-nowrap leading-none ${
                      p.isDead
                        ? "bg-neutral-800 border-neutral-700 text-neutral-500"
                        : isRevealed
                          ? "bg-rose-950 border-rose-900 text-rose-400"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {isRevealed ? `${lostHp}/${maxHp}` : `${lostHp}`}
                  </div>
                </div>
                <div className="mt-1.5 space-y-0 max-w-[55px]">
                  <div className="text-[8px] font-extrabold text-white truncate">
                    {p.name} {isSelf && <span className="text-[6.5px] text-[#7BA2BE] font-bold bg-[#7BA2BE]/10 px-0.5 rounded border border-[#7BA2BE]/20">(Bạn)</span>}
                  </div>
                  <div className="text-[6.5px] text-neutral-455 font-bold truncate uppercase tracking-tight">
                    {false === isRevealed
                      ? "???"
                      : Alignment.SHADOW === p.character.alignment
                        ? "Bóng Tối"
                        : Alignment.HUNTER === p.character.alignment
                          ? "Thợ Săn"
                          : "Trung Lập"}
                  </div>
                  {isRevealed && (
                    <div className="text-[6.5px] text-neutral-550 font-medium truncate">
                      {p.character.name}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop list
  return (
    <div className="hidden lg:flex lg:col-span-3 flex-col h-full">
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3 flex-1 flex flex-col h-full bg-cover bg-center"
        style={{ backgroundImage: "url('/assets/images/bg/player-list-panel-bg.png')" }}
      >
        <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-1 border-b border-neutral-850 pb-2">
          Danh Sách Anh Hùng
        </h4>
        <div className="space-y-3 overflow-y-auto pr-1 scrollbar-thin flex-1 max-h-[70vh]">
          {activeGame.players.map((p) => {
            const isSelf = p.id === playerId;
            const isRevealed = isSelf || p.alignmentRevealed || p.isDead;
            const maxHp = p.character.hp;
            const lostHp = maxHp - p.currentHp;
            const isCurrentTurn = p.id === turnId && !p.isDead;

            return (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p)}
                className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                  p.isDead
                    ? "bg-neutral-950/20 border-neutral-900 opacity-60 hover:bg-neutral-900/20"
                    : isCurrentTurn
                      ? "bg-neutral-800/60 border-[#7BA2BE]/50 ring-1 ring-[#7BA2BE]/30 shadow-[0_0_12px_rgba(123,162,190,0.15)] hover:bg-neutral-700/60"
                      : isSelf
                        ? "bg-neutral-900/60 border-[#4437AC]/40 hover:bg-neutral-800/60"
                        : "bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900/60"
                }`}
              >
                {/* Avatar Area */}
                <div className="relative shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-xs shadow ${
                      p.isDead
                        ? "bg-neutral-800 border-neutral-700 text-neutral-500"
                        : "bg-neutral-900 text-white"
                    }`}
                    style={p.isDead ? {} : { borderColor: p.color }}
                  >
                    {p.isDead ? (
                      <Skull className="w-5 h-5 text-neutral-500" />
                    ) : p.isBot ? (
                      <Bot className="w-5 h-5" style={{ color: p.color }} />
                    ) : (
                      <User className="w-5 h-5" style={{ color: p.color }} />
                    )}
                  </div>

                  {(p.hasGuardianAngel || p.hasGregorShield) && !p.isDead && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <Shield className={`w-4 h-4 drop-shadow-[0_0_5px_rgba(251,191,36,0.6)] ${
                        p.hasGuardianAngel ? "text-amber-400" : "text-cyan-400"
                      }`} />
                    </div>
                  )}

                  {/* Damage Taken Badge */}
                  <div
                    className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[11px] font-extrabold border shadow-sm whitespace-nowrap leading-none ${
                      p.isDead
                        ? "bg-neutral-800 border-neutral-700 text-neutral-500"
                        : isRevealed
                          ? "bg-rose-950 border-rose-905 text-rose-400"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400"
                    }`}
                  >
                    {isRevealed ? `${lostHp}/${maxHp}` : `${lostHp}`}
                  </div>
                </div>

                {/* Player Details */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate ${p.isDead ? "text-neutral-600 line-through font-normal" : "text-white"}`}>
                      {p.name} {p.isBot ? "(Bot)" : ""} {isSelf && <span className="text-[8px] text-[#7BA2BE] bg-[#7BA2BE]/10 px-1 py-0.2 rounded border border-[#7BA2BE]/20 ml-0.5">Bạn</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${
                      p.isDead
                        ? "text-neutral-600 bg-neutral-950 border-neutral-900"
                        : !isRevealed
                          ? "text-neutral-500 bg-neutral-950 border-neutral-800"
                          : p.character.alignment === Alignment.SHADOW
                            ? "text-red-400 bg-red-950/20 border-red-900/30"
                            : p.character.alignment === Alignment.HUNTER
                              ? "text-blue-400 bg-blue-950/20 border-blue-900/30"
                              : "text-amber-400 bg-amber-950/20 border-amber-900/30"
                    }`}>
                      {!isRevealed
                        ? "???"
                        : p.character.alignment === Alignment.SHADOW
                          ? "Bóng Tối"
                          : p.character.alignment === Alignment.HUNTER
                            ? "Thợ Săn"
                            : "Trung Lập"}
                    </span>
                    <span className={`text-[10px] font-semibold truncate ${p.isDead ? "text-neutral-600 line-through font-normal" : "text-neutral-300"}`}>
                      {!isRevealed ? "???" : p.character.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
