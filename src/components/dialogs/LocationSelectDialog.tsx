import React from "react";
import { GameState } from "../../types";
import { LOCATIONS } from "../../data/locations";

interface LocationSelectDialogProps {
  isOpen: boolean;
  activeGame: GameState;
  playerId: string;
  compassChoices: string[] | null;
  onSelect: (locId: string) => void;
}

export default function LocationSelectDialog({
  isOpen,
  activeGame,
  playerId,
  compassChoices,
  onSelect
}: LocationSelectDialogProps) {
  if (!isOpen) return null;

  const currentLocId = activeGame.players.find(p => p.id === playerId)?.locationId;
  const currentLoc = currentLocId ? LOCATIONS.find(l => l.id === currentLocId) : null;
  const otherPlayersAtCurrentLoc = currentLocId ? activeGame.players.filter(
    p => p.id !== playerId && false === p.isDead && p.locationId === currentLocId
  ) : [];
  const unmovedPlayers = activeGame.players.filter(
    p => false === p.isDead && null === p.locationId
  );

  const areaGroups = [
    {
      label: "Khu Vực A",
      color: "text-violet-400 border-violet-500/30 bg-violet-500/5",
      dot: "bg-violet-500",
      ids: ["loc_hermit", "loc_fountain"]
    },
    {
      label: "Khu Vực B",
      color: "text-sky-400 border-sky-500/30 bg-sky-500/5",
      dot: "bg-sky-500",
      ids: ["loc_church", "loc_cemetery"]
    },
    {
      label: "Khu Vực C",
      color: "text-amber-400 border-amber-500/30 bg-amber-500/5",
      dot: "bg-amber-500",
      ids: ["loc_woods", "loc_anvil"]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl w-full max-w-4xl shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto scrollbar-thin">
        <div className="text-center space-y-1">
          {compassChoices !== null ? (
            <>
              <span className="text-[9px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest bg-[#7BA2BE]/10 text-[#7BA2BE] border-[#7BA2BE]/20">
                La Bàn Thần Bí (Mystic Compass)
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight pt-1">
                Di Chuyển Bằng La Bàn Thần Bí
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hãy chọn 1 trong 2 địa điểm được xác định bởi kết quả lắc xúc xắc của La Bàn Thần Bí!
              </p>
            </>
          ) : "action" === activeGame.phase ? (
            <>
              <span className="text-[9px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest bg-orange-500/10 text-orange-400 border-orange-500/20">
                Cổng Dịch Chuyển Bóng Tối
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight pt-1">
                Dịch Chuyển Cổng Bóng Tối
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hãy click chọn 1 địa điểm bất kỳ dưới đây để dịch chuyển token đến đó! (Trừ vị trí hiện tại của bạn)
              </p>
            </>
          ) : (
            <>
              <span className="text-[9px] border px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {activeGame.players[activeGame.turnIndex]?.character.name.startsWith("Emi") && true === activeGame.players[activeGame.turnIndex]?.alignmentRevealed && false === activeGame.players[activeGame.turnIndex]?.abilityDisabled
                  ? "Dịch Chuyển Tức Thời (Emi)"
                  : "Đổ Ra Số 7 May Mắn"}
              </span>
              <h3 className="text-lg font-bold text-white tracking-tight pt-1">
                {activeGame.players[activeGame.turnIndex]?.character.name.startsWith("Emi") && true === activeGame.players[activeGame.turnIndex]?.alignmentRevealed && false === activeGame.players[activeGame.turnIndex]?.abilityDisabled
                  ? "Chọn Điểm Dịch Chuyển Của Emi"
                  : "Chọn Điểm Dịch Chuyển Tự Do"}
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Hãy click chọn 1 địa điểm bất kỳ dưới đây để dịch chuyển token đến đó! (Trừ vị trí hiện tại của bạn)
              </p>
            </>
          )}
        </div>

        {/* THÔNG TIN VỊ TRÍ HIỆN TẠI & NGƯỜI CHƠI CHƯA DI CHUYỂN */}
        <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 text-[11px] space-y-2 text-left font-sans shadow-inner">
          {currentLoc ? (
            <div className="flex flex-wrap items-center justify-between gap-1">
              <span className="text-neutral-400 font-medium">
                📍 Vị trí hiện tại của bạn: <strong className="text-[#7BA2BE]">{currentLoc.name}</strong>
              </span>
              {otherPlayersAtCurrentLoc.length > 0 ? (
                <span className="text-amber-400 font-semibold">
                  (Đang đứng cùng: {otherPlayersAtCurrentLoc.map(p => p.name).join(", ")})
                </span>
              ) : (
                <span className="text-neutral-500 italic text-[10px]">(Không có ai đứng cùng)</span>
              )}
            </div>
          ) : (
            <div className="text-amber-400 font-semibold flex items-center gap-1">
              📍 Bạn chưa di chuyển đến vị trí nào trên bản đồ.
            </div>
          )}

          {unmovedPlayers.length > 0 && (
            <div className="text-neutral-400 pt-1.5 border-t border-neutral-900 flex items-center justify-between">
              <span className="text-[10px] font-medium text-neutral-500">👥 Chưa di chuyển (chờ lượt 1):</span>
              <span className="text-amber-300 font-bold text-[10px]">{unmovedPlayers.map(p => p.name).join(", ")}</span>
            </div>
          )}
        </div>

        {/* LƯỚI 3 CỘT - GIỮ NGUYÊN CẤU TRÚC CẶP ĐÔI NHƯ BẢNG CHƠI */}
        <div className="grid grid-cols-3 gap-4">
          {areaGroups.map(group => (
            <div key={group.label} className={`rounded-xl border p-3 space-y-3 ${group.color}`}>
              {/* Area header */}
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${group.dot}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{group.label}</span>
                <span className="text-[9px] opacity-60">(cùng tầm đánh)</span>
              </div>

              {/* Two locations in this area */}
              <div className="space-y-2">
                {group.ids.map(locId => {
                  const loc = LOCATIONS.find(l => l.id === locId)!;
                  const isCurrentLoc = locId === currentLocId;
                  const isFiltered = compassChoices ? !compassChoices.includes(locId) : false;

                  if (!loc || isFiltered) return null;

                  const otherStandingPlayers = activeGame.players.filter(
                    p => p.id !== playerId && false === p.isDead && p.locationId === locId
                  );

                  if (isCurrentLoc) {
                    return (
                      <div
                        key={locId}
                        className="p-3 rounded-lg bg-neutral-950/60 border border-neutral-700 opacity-50 cursor-not-allowed space-y-1.5 text-left"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[11px] text-neutral-400 line-through">{loc.name}</span>
                          <span className="text-[9px] text-neutral-600 font-mono bg-neutral-900 px-1.5 py-0.5 rounded">
                            {loc.rollValues.join("/")}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-600 leading-relaxed">Vị trí hiện tại của bạn</p>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={locId}
                      onClick={() => onSelect(locId)}
                      className="w-full p-3 bg-neutral-950 hover:bg-[#4437AC]/20 border border-neutral-800 hover:border-[#7BA2BE]/40 rounded-lg text-left text-white transition-all space-y-1.5 group cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[11px] text-white group-hover:text-[#7BA2BE] transition-colors">
                          {loc.name}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-mono bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
                          {loc.rollValues.join("/")}
                        </span>
                      </div>

                      <p className="text-[10px] text-neutral-400 leading-relaxed font-normal">
                        {loc.description}
                      </p>

                      <div className="pt-1.5 border-t border-neutral-900/80 flex items-center justify-between text-[9px]">
                        <span className="text-neutral-500 font-medium">Đối thủ ở đây:</span>
                        {otherStandingPlayers.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {otherStandingPlayers.map(p => (
                              <span
                                key={p.id}
                                className="px-1.5 py-0.5 rounded font-bold text-white shadow-sm"
                                style={{ backgroundColor: p.color + "30", border: `1px solid ${p.color}60` }}
                              >
                                {p.name}{p.isBot ? " (Bot)" : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-neutral-600 italic">Trống</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
