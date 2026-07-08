import React, { useState } from "react";
import { Player, GameState } from "../../types";
import { X } from "lucide-react";

interface AbilityTargetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeGame: GameState;
  playerId: string;
  onConfirm: (targetPlayerId: string) => void;
}

export default function AbilityTargetDialog({
  isOpen,
  onClose,
  activeGame,
  playerId,
  onConfirm
}: AbilityTargetDialogProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");

  if (!isOpen) {
    return null;
  }

  const currentPlayer = activeGame.players.find((p) => p.id === playerId);
  if (!currentPlayer) {
    return null;
  }

  const charName = currentPlayer.character.name;
  const abilityName = currentPlayer.character.abilityName;
  const abilityDesc = currentPlayer.character.abilityDesc;

  // Filter players based on character name
  let targetablePlayers: Player[] = [];
  if (charName.startsWith("Fuka")) {
    // Fuka: can target any alive player, including self
    targetablePlayers = activeGame.players.filter((p) => !p.isDead);
  } else if (charName.startsWith("Franklin") || charName.startsWith("Ellen")) {
    // Franklin, Ellen: target any alive player except self
    targetablePlayers = activeGame.players.filter((p) => !p.isDead && p.id !== playerId);
  }

  const handleConfirm = () => {
    if (selectedTargetId) {
      onConfirm(selectedTargetId);
      setSelectedTargetId("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl w-full max-w-md shadow-2xl relative space-y-5 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#4437AC]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-1">
          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-purple-400 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
            Kích Hoạt Tuyệt Kỹ: {charName}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight pt-1">
            {abilityName}
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed px-2">
            {abilityDesc}
          </p>
        </div>

        <div className="space-y-4 pt-2 text-left">
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-neutral-400">
              Chọn 1 đối tượng để tác dụng hiệu lực:
            </label>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#7BA2BE] cursor-pointer"
            >
              <option value="">-- Chọn người chơi --</option>
              {targetablePlayers.map((p) => {
                const isSelf = p.id === playerId;
                const showHp = p.alignmentRevealed || isSelf;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isBot ? "(Bot)" : ""} {isSelf ? "(Bản thân)" : ""} (HP: {showHp ? `${p.currentHp}/${p.character.hp}` : "??/??"})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-all cursor-pointer text-center"
            >
              Hủy Bỏ
            </button>
            <button
              onClick={handleConfirm}
              disabled={"" === selectedTargetId}
              className="w-full py-2 bg-[#4437AC] hover:bg-[#4437AC]/90 disabled:opacity-30 rounded-xl text-xs font-bold text-white transition-all shadow cursor-pointer text-center"
            >
              Xác Nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
