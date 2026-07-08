import React from "react";
import { Compass, User } from "lucide-react";
import { BoardLocation, Player } from "../types";
import { LOCATIONS } from "../data/locations";

// Mapping location id -> background image
const LOCATION_BG: Record<string, string> = {
  loc_hermit:   "/assets/images/map/hermits-cabin.png",
  loc_fountain: "/assets/images/map/underworld-gate.png",
  loc_church:   "/assets/images/map/church.png",
  loc_cemetery: "/assets/images/map/cemetery.png",
  loc_woods:    "/assets/images/map/weird-woods.png",
  loc_anvil:    "/assets/images/map/erstwhile-altar.png",
};

interface GameBoardProps {
  locations: BoardLocation[];
  players: Player[];
  currentPlayerId: string;
}

export default function GameBoard({
  locations,
  players,
  currentPlayerId
}: GameBoardProps) {

  // Group locations into Areas for easy visual representation
  const areas = [
    {
      name: "Khu Vực A (Khám Phá)",
      locIds: ["loc_hermit", "loc_fountain"],
      colorClass: "border-emerald-500/30 bg-emerald-950/5",
      accentColor: "text-emerald-400"
    },
    {
      name: "Khu Vực B (Thánh Địa & Nghĩa Trang)",
      locIds: ["loc_church", "loc_cemetery"],
      colorClass: "border-blue-500/30 bg-blue-950/5",
      accentColor: "text-blue-400"
    },
    {
      name: "Khu Vực C (Hắc Ám & Ma Thuật)",
      locIds: ["loc_anvil", "loc_woods"],
      colorClass: "border-purple-500/30 bg-purple-950/5",
      accentColor: "text-purple-400"
    }
  ];

  const unmovedPlayers = players.filter(p => null === p.locationId && false === p.isDead);

  return (
    <div className="space-y-4 font-sans">
      
      {/* Người chơi chưa di chuyển (chờ lượt 1) */}
      {0 < unmovedPlayers.length && (
        <div className="hidden sm:flex p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl flex-wrap items-center justify-between gap-2 text-xs text-amber-300">
          <span className="font-bold flex items-center gap-1.5 text-[11px]">
            🚩 Chưa di chuyển lượt đầu ({unmovedPlayers.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {unmovedPlayers.map(p => (
              <span 
                key={p.id}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: p.color + "30", border: `1px solid ${p.color}60` }}
              >
                {p.name} {p.isBot ? "(Bot)" : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Bản đồ 6 Địa Điểm Ghép Cặp (Areas) */}
      <div className="space-y-3 w-full">
        <h3 className="text-[10px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 pl-1">
          <Compass className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7BA2BE]" />
          Bản đồ Thế giới Shadow Hunters
        </h3>

        {/* Thiết kế bản đồ phân chia 3 cột (khu vực) chứa các thẻ dọc bo tròn */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-4 md:gap-5">
          {areas.map((area, aIdx) => (
            <div 
              key={aIdx}
              className="border border-neutral-800 bg-neutral-900/10 rounded-xl sm:rounded-2xl p-1.5 sm:p-4 flex flex-col gap-2 sm:gap-4 shadow-xl"
            >
              {/* Tiêu đề khu vực đầu cột */}
              <div className="flex items-center gap-1.5 border-b border-neutral-850 pb-1.5 sm:pb-2.5">
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse shrink-0 ${
                  0 === aIdx ? "bg-emerald-500" : 1 === aIdx ? "bg-blue-500" : "bg-purple-500"
                }`}></span>
                <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider truncate ${area.accentColor}`}>
                  {area.name}
                </span>
              </div>

              {/* Danh sách 2 thẻ dọc địa điểm */}
              <div className="flex flex-col gap-2 sm:gap-4 flex-1">
                {area.locIds.map((locId) => {
                  const loc = locations.find((l) => l.id === locId)!;
                  const standingPlayers = players.filter((p) => loc.id === p.locationId && false === p.isDead);

                  return (
                    <div 
                      key={loc.id}
                      className="border border-neutral-850 hover:border-neutral-700 rounded-lg sm:rounded-xl p-1.5 sm:p-3.5 flex flex-col justify-between flex-1 min-h-[105px] sm:min-h-[140px] transition-all duration-300 shadow-md group relative text-left overflow-hidden"
                      style={{
                        backgroundImage: `linear-gradient(to bottom, rgba(10,10,15,0.72) 0%, rgba(10,10,15,0.88) 60%, rgba(10,10,15,0.97) 100%), url(${LOCATION_BG[loc.id]})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="space-y-1 sm:space-y-2">
                        <div className="flex items-start justify-between gap-1">
                          <div className="min-w-0">
                            <h4 className="text-white font-bold text-[9px] sm:text-xs tracking-tight leading-snug group-hover:text-[#7BA2BE] transition-colors truncate" title={loc.name}>
                              {loc.name}
                            </h4>
                            <p className="text-[7px] sm:text-[9px] text-neutral-500 font-mono mt-0.5">
                              Xúc xắc: {loc.rollValues.join("/")}
                            </p>
                          </div>
                        </div>

                        <p className="text-[8px] sm:text-[11px] text-neutral-400 leading-normal sm:leading-relaxed font-medium line-clamp-3 sm:line-clamp-none">
                          {loc.description}
                        </p>
                      </div>

                      {/* Hiển thị danh sách người chơi đang ở đây */}
                      <div className="border-t border-neutral-900 pt-1.5 sm:pt-2.5 mt-1.5 sm:mt-2.5">
                        <span className="text-[7px] sm:text-[8px] text-neutral-500 block mb-1 sm:mb-1.5 font-bold uppercase tracking-wider">
                          Ở đây ({standingPlayers.length}):
                        </span>
                        {0 === standingPlayers.length ? (
                          <span className="text-[8px] sm:text-[9px] text-neutral-600 italic">Trống</span>
                        ) : (
                          <div className="flex flex-wrap gap-0.5 sm:gap-1">
                            {standingPlayers.map((p) => (
                              <span 
                                key={p.id}
                                className="inline-flex items-center gap-0.5 sm:gap-1 px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[7px] sm:text-[9px] font-semibold text-white shadow transition-all hover:scale-105"
                                style={{ backgroundColor: p.color + "20", border: `1px solid ${p.color}40` }}
                              >
                                <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: p.color }}></span>
                                <span className="truncate max-w-[35px] sm:max-w-[80px]">{p.name}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
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
