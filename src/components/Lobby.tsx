import React, { useState, useEffect } from "react";
import { Users, User, Shield, Globe, Lock, Play, Plus, ArrowRight, RefreshCw, Bot, Sparkles, MessageSquare, BookOpen, ArrowLeft, Info } from "lucide-react";
import { createGameRoom, joinGameRoom, getPublicRooms } from "../firebase";
import { CHARACTERS } from "../data/cards";
import { Alignment } from "../types";

const bgPc = "/assets/images/bg/bg-pc-compressed.png";
const bgMobile = "/assets/images/bg/bg-mobile-compressed.png";

interface LobbyProps {
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
  onStartSoloGame: (selectedCharName?: string, playerCount?: number, selectedAlignment?: Alignment) => void;
  onEnterRoom: (roomId: string) => void;
  onOpenRules: () => void;
  onOpenCharacterList: () => void;
  onOpenEquipmentList: () => void;
  onOpenCardList: () => void;
  initialView?: "home" | "start";
}

export default function Lobby({
  playerId,
  playerName,
  setPlayerName,
  onStartSoloGame,
  onEnterRoom,
  onOpenRules,
  onOpenCharacterList,
  onOpenEquipmentList,
  onOpenCardList,
  initialView = "home"
}: LobbyProps) {
  const [lobbyView, setLobbyView] = useState<"home" | "start">(initialView);

  useEffect(() => {
    setLobbyView(initialView);
  }, [initialView]);

  // Trạng thái các Modal
  const [showConfirmBotModal, setShowConfirmBotModal] = useState(false);
  const [showNameInputModal, setShowNameInputModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Trạng thái cho chế độ Luyện tập Bot
  const [selectedPlayerCount, setSelectedPlayerCount] = useState(4);
  const [selectedAlignment, setSelectedAlignment] = useState<Alignment | "RANDOM">("RANDOM");
  const [selectedCharName, setSelectedCharName] = useState<string | null>(null);

  // Hành động phòng trực tuyến đang chờ (Tạo hoặc Vào phòng)
  const [pendingRoomAction, setPendingRoomAction] = useState<{
    type: "create" | "join";
    roomId?: string;
  } | null>(null);

  // Biệt danh tạm thời để chỉnh sửa trong Modal nhập tên (được cache qua localStorage)
  const [tempPlayerName, setTempPlayerName] = useState(() => {
    return localStorage.getItem("sh_player_name") || playerName || "";
  });

  const [roomIdInput, setRoomIdInput] = useState("");
  const [isPublicRoom, setIsPublicRoom] = useState(true);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Đồng bộ hóa danh sách phòng công khai khi chuyển sang màn hình START
  const fetchPublicRooms = async () => {
    setLoadingRooms(true);
    try {
      const rooms = await getPublicRooms();
      setPublicRooms(rooms);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if ("start" === lobbyView) {
      fetchPublicRooms();
    }
  }, [lobbyView]);

  // Khởi động luồng Vào phòng trực tuyến (hiển thị modal nhập biệt danh)
  const handleStartJoinFlow = (targetRoomId: string) => {
    const cleanId = targetRoomId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMsg("Vui lòng nhập mã phòng!");
      return;
    }
    setErrorMsg("");
    setPendingRoomAction({ type: "join", roomId: cleanId });
    setShowNameInputModal(true);
  };

  // Khởi động luồng Tạo phòng trực tuyến (hiển thị modal nhập biệt danh)
  const handleStartCreateFlow = () => {
    setErrorMsg("");
    setPendingRoomAction({ type: "create" });
    setShowNameInputModal(true);
  };

  // Xác nhận nhập tên cá nhân trong Modal và tiến hành hành động phòng chờ
  const handleConfirmName = async () => {
    const cleanName = tempPlayerName.trim();
    if (!cleanName) {
      setErrorMsg("Vui lòng nhập biệt danh để tiếp tục!");
      return;
    }

    // Lưu tên vào App State và lưu bộ nhớ đệm localStorage
    setPlayerName(cleanName);
    localStorage.setItem("sh_player_name", cleanName);

    setShowNameInputModal(false);
    setErrorMsg("");

    if (!pendingRoomAction) return;

    setSubmitting(true);
    try {
      if (pendingRoomAction.type === "create") {
        const newRoomId = await createGameRoom(playerId, cleanName, isPublicRoom);
        onEnterRoom(newRoomId);
      } else if (pendingRoomAction.type === "join" && pendingRoomAction.roomId) {
        await joinGameRoom(pendingRoomAction.roomId, playerId, cleanName);
        onEnterRoom(pendingRoomAction.roomId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi khi xử lý phòng chơi.");
    } finally {
      setSubmitting(false);
      setPendingRoomAction(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 font-sans relative z-10 flex flex-col items-center">

      {/* BACKGROUND DECORATIONS (FIXED UNDERLAY) */}
      <div className="fixed inset-0 z-[-1] overflow-hidden">
        {/* PC Background */}
        <div
          className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: `url(${bgPc})` }}
        />
        {/* Mobile Background */}
        <div
          className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: `url(${bgMobile})` }}
        />
        {/* Dark overlay mixing with dominant colors */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#07080f]/98 via-[#13112d]/93 to-[#261f5c]/85 mix-blend-multiply"
        />
        {/* Radial highlight for professional gaming portal glow */}
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(68,55,172,0.15)_0%,transparent_70%)]"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-neutral-950/70"
        />
      </div>

      {lobbyView === "home" ? (
        /* ================= MÀN HÌNH TRANG CHỦ (KHÔNG CÓ DIV ĐÓNG GÓI) ================= */
        <div className="w-full flex-1 flex flex-col justify-between items-center text-center py-10 min-h-[75vh]">

          {/* LOGO & TITLE SECTION: Ở PHẦN GIỮA THEO CHIỀU NGANG PHÍA TRÊN */}
          <div className="mt-8 mb-auto md:my-auto space-y-5 md:space-y-6 animate-fadeIn flex flex-col items-center">
            <div className="inline-flex p-4 bg-gradient-to-b from-[#7ba2be]/15 to-[#4437ac]/30 border border-[#7ba2be]/30 rounded-2xl mb-1 text-[#7ba2be] shadow-[0_0_30px_rgba(68,55,172,0.5)] animate-pulse">
              <Shield className="w-16 h-16 stroke-[1.5] text-[#7ba2be]" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#7ba2be] via-white to-[#4437ac] filter drop-shadow-[0_2px_10px_rgba(68,55,172,0.7)] uppercase">
              SHADOW HUNTERS
            </h1>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7ba2be] font-extrabold tracking-widest uppercase bg-[#4437ac]/15 border border-[#4437ac]/30 px-3.5 py-1 rounded-full w-fit">
              BY TZANS
            </div>
          </div>

          {/* BOTTOM BUTTONS ROW: CỐ ĐỊNH Ở BÊN DƯỚI */}
          <div className="fixed bottom-10 left-0 right-0 max-w-[480px] mx-auto px-6 flex items-center justify-center gap-4 animate-slideUp z-20">
            {/* Button 1: Bot (Icon only) */}
            <button
              onClick={() => setShowConfirmBotModal(true)}
              title="Luyện tập với Bot"
              className="w-14 h-14 rounded-2xl bg-[#0a0c16]/90 border border-[#4437ac]/50 hover:border-[#7ba2be]/70 text-[#7ba2be] hover:text-white hover:bg-[#4437ac]/30 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(68,55,172,0.3)] active:scale-95 group"
            >
              <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>

            {/* Button 2: START */}
            <button
              onClick={() => setLobbyView("start")}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-[#4437ac] to-[#5b4fcd] hover:from-[#5b4fcd] hover:to-[#7ba2be] text-white font-black text-base uppercase tracking-widest rounded-2xl shadow-[0_4px_25px_rgba(68,55,172,0.5)] hover:shadow-[0_4px_30px_rgba(123,162,190,0.6)] transition-all duration-300 active:scale-98 cursor-pointer border border-[#7ba2be]/30"
            >
              START
            </button>

            {/* Button 3: Info (Icon only) */}
            <button
              onClick={() => setShowInfoModal(true)}
              title="Thông tin"
              className="w-14 h-14 rounded-2xl bg-[#0a0c16]/90 border border-[#4437ac]/50 hover:border-[#7ba2be]/70 text-[#7ba2be] hover:text-white hover:bg-[#4437ac]/30 transition-all flex items-center justify-center cursor-pointer shadow-[0_0_20px_rgba(68,55,172,0.3)] active:scale-95 group"
            >
              <Info className="w-6 h-6 group-hover:scale-110 transition-transform" />
            </button>
          </div>

        </div>
      ) : (
        /* ================= MÀN HÌNH CHỌN START (KHÔNG CÓ DIV ĐÓNG GÓI, TỐI ƯU CHIỀU RỘNG & CHIỀU CAO) ================= */
        <div className="w-full max-w-5xl flex-1 flex flex-col justify-between min-h-[75vh] relative animate-fadeIn px-0 sm:px-6">

          {/* Error message floating warning if any */}
          {errorMsg && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-full max-w-md p-3 bg-rose-950/90 border border-rose-900/50 text-rose-350 text-xs text-center rounded-2xl font-bold z-30 animate-slideDown shadow-xl shadow-rose-950/30">
              ⚠️ {errorMsg}
            </div>
          )}

          <div className="flex-1 flex flex-col justify-between">

            {/* Header: Title and Back button */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-3 sm:pb-4 mb-4 sm:mb-6">
              <button
                onClick={() => { setLobbyView("home"); setErrorMsg(""); }}
                className="shrink-0 p-2.5 bg-[#030408]/60 border border-[#4437ac]/40 hover:border-[#7ba2be]/60 text-[#7ba2be] hover:text-white rounded-xl transition-all cursor-pointer shadow-lg active:scale-95"
                title="Quay lại trang chủ"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="flex-1 text-lg sm:text-2xl font-black text-[#7ba2be] uppercase tracking-widest text-right filter drop-shadow-[0_2px_8px_rgba(68,55,172,0.4)] leading-tight">
                DANH SÁCH PHÒNG CHỜ
              </h2>
            </div>

            {/* Grid layout to distribute contents: 2 Columns on desktop, 1 on mobile */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 lg:gap-12 flex-1 items-stretch mb-4 sm:mb-6">

              {/* Column 1: List of public rooms (Occupies full height available) */}
              <div className="flex flex-col bg-[#0a0c16]/50 backdrop-blur-md border border-[#4437ac]/20 rounded-3xl p-3.5 sm:p-6 flex-1 shadow-[0_0_20px_rgba(68,55,172,0.1)]">
                <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
                  <span className="text-xs font-black text-[#7ba2be] uppercase tracking-widest flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-[#7ba2be]" />
                    Phòng Công Khai
                  </span>
                  <button
                    onClick={fetchPublicRooms}
                    className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingRooms ? "animate-spin" : ""}`} />
                    Làm mới
                  </button>
                </div>

                {loadingRooms ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-[#7ba2be] animate-spin" />
                    <span className="text-xs text-neutral-455 mt-3 font-semibold">Đang quét tìm phòng chơi...</span>
                  </div>
                ) : 0 === publicRooms.length ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 border border-dashed border-[#4437ac]/20 rounded-2xl bg-[#030408]/10">
                    <span className="text-xs text-neutral-500 italic">Chưa có phòng chơi nào trực tuyến. Hãy tạo phòng mới ngay!</span>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3 pr-1 scrollbar-thin max-h-[220px] sm:max-h-[320px] lg:max-h-[420px]">
                    {publicRooms.map((room) => (
                      <div
                        key={room.roomId}
                        className="p-3 sm:p-4 bg-[#0a0c16]/85 border border-[#4437ac]/30 hover:border-[#7ba2be]/60 rounded-2xl flex items-center gap-2 justify-between hover:shadow-[0_0_15px_rgba(68,55,172,0.2)] transition-all group"
                      >
                        <div className="leading-tight min-w-0 flex-1">
                          <span className="text-sm font-black tracking-widest text-[#7ba2be] block">
                            #{room.roomId}
                          </span>
                          <span className="text-[11px] sm:text-xs text-neutral-400 font-semibold mt-0.5 block truncate">
                            Người chơi: <strong className="text-white">{room.players?.length || 0}/12</strong>
                            <span className="hidden xs:inline"> • Chủ phòng: <strong className="text-white">{room.players?.[0]?.name || "Ẩn danh"}</strong></span>
                          </span>
                          <span className="xs:hidden text-[10px] text-neutral-500 truncate block">
                            Chủ: <strong className="text-neutral-300">{room.players?.[0]?.name || "Ẩn danh"}</strong>
                          </span>
                        </div>
                        <button
                          onClick={() => handleStartJoinFlow(room.roomId)}
                          className="shrink-0 px-3 sm:px-4 py-2 bg-[#4437ac] hover:bg-[#7ba2be] hover:shadow-[0_0_15px_rgba(123,162,190,0.4)] text-xs font-black rounded-xl text-white transition-all cursor-pointer active:scale-95"
                        >
                          VÀO
                          <br className="hidden sm:block" />
                          <span className="hidden sm:inline">PHÒNG</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Column 2: Join & Create options */}
              <div className="flex flex-col justify-start space-y-6">

                {/* Section 2.1: Join with room code */}
                <div className="bg-[#0a0c16]/50 backdrop-blur-md border border-[#4437ac]/20 rounded-3xl p-3.5 sm:p-6 shadow-[0_0_20px_rgba(68,55,172,0.1)] space-y-3 sm:space-y-4">
                  <label className="block text-xs font-black text-[#7ba2be] uppercase tracking-widest">
                    Vào bằng mã phòng chơi
                  </label>
                  <div className="flex gap-2 sm:gap-3">
                    <input
                      type="text"
                      value={roomIdInput}
                      onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                      placeholder="MÃ PHÒNG (VD: ABCDE)"
                      maxLength={5}
                      className="flex-1 min-w-0 px-3 sm:px-4 py-3 bg-[#030408]/90 border border-[#4437ac]/45 rounded-xl text-white text-center font-black tracking-widest text-sm placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-[#7ba2be] focus:border-[#7ba2be]"
                    />
                    <button
                      onClick={() => handleStartJoinFlow(roomIdInput)}
                      disabled={submitting}
                      className="shrink-0 px-4 sm:px-6 py-3 bg-[#4437ac] hover:bg-[#7ba2be] disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-lg active:scale-95"
                    >
                      VÀO PHÒNG
                    </button>
                  </div>
                </div>

                {/* Section 2.2: Create new room */}
                <div className="bg-[#0a0c16]/50 backdrop-blur-md border border-[#4437ac]/20 rounded-3xl p-3.5 sm:p-6 shadow-[0_0_20px_rgba(68,55,172,0.1)] space-y-3 sm:space-y-4">
                  <span className="block text-xs font-black text-[#7ba2be] uppercase tracking-widest">
                    Thiết lập trận đấu trực tuyến
                  </span>

                  <div className="flex items-center gap-2 justify-between bg-[#030408]/75 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-[#4437ac]/30">
                    <span className="text-[11px] sm:text-xs text-neutral-400 font-bold uppercase tracking-wider shrink-0">Trạng thái phòng:</span>
                    <button
                      onClick={() => setIsPublicRoom(!isPublicRoom)}
                      className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shrink-0 ${isPublicRoom
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                    >
                      {isPublicRoom ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {isPublicRoom ? "CÔNG KHAI" : "RIÊNG TƯ"}
                    </button>
                  </div>

                  <button
                    onClick={handleStartCreateFlow}
                    disabled={submitting}
                    className="w-full py-3.5 sm:py-4 bg-[#4437ac] hover:bg-[#7ba2be] hover:shadow-[0_0_20px_rgba(123,162,190,0.4)] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    Tạo phòng chơi mới
                  </button>
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL THIẾT LẬP LUYỆN TẬP BOT ================= */}
      {showConfirmBotModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-[#0a0c16]/95 border border-[#4437ac]/50 p-4 sm:p-6 rounded-3xl w-full max-w-3xl shadow-[0_0_40px_rgba(68,55,172,0.4)] space-y-4 sm:space-y-6 animate-slideUp max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="p-2 bg-[#4437ac]/20 border border-[#7ba2be]/20 rounded-xl text-[#7ba2be]">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-black text-sm sm:text-base uppercase tracking-wider text-left">
                  Thiết Lập Trận Đấu AI
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-400 font-medium text-left">
                  Tùy chỉnh số lượng người chơi, phe phái và nhân vật trước khi bắt đầu.
                </p>
              </div>
            </div>

            {/* Scrollable Setup Options */}
            <div className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 pr-1 scrollbar-thin text-left">
              {/* Option 1: Số lượng người chơi */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-[#7ba2be] uppercase tracking-widest">
                  1. Số lượng người chơi
                </label>
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                  {[3, 4, 5, 6, 7, 8].map(num => (
                    <button
                      key={num}
                      onClick={() => setSelectedPlayerCount(num)}
                      className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                        selectedPlayerCount === num
                          ? "bg-[#4437ac] text-white border-[#7ba2be] shadow-[0_0_10px_rgba(68,55,172,0.5)]"
                          : "bg-[#030408]/80 text-neutral-400 border-[#4437ac]/30 hover:border-[#4437ac]/70"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                {/* Description helper of alignment count */}
                <p className="text-[10px] text-amber-400/90 font-bold bg-amber-500/5 border border-amber-500/10 px-3 py-1.5 rounded-lg">
                  💡 Tỷ lệ phe: {
                    3 === selectedPlayerCount ? "1 Shadow • 1 Hunter • 1 Neutral" :
                    4 === selectedPlayerCount ? "2 Shadow • 2 Hunter • 0 Neutral" :
                    5 === selectedPlayerCount ? "2 Shadow • 2 Hunter • 1 Neutral" :
                    6 === selectedPlayerCount ? "2 Shadow • 2 Hunter • 2 Neutral" :
                    7 === selectedPlayerCount ? "3 Shadow • 3 Hunter • 1 Neutral" :
                    "3 Shadow • 3 Hunter • 2 Neutral"
                  }
                </p>
              </div>

              {/* Option 2: Chọn phe phái trước (Bắt buộc) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-[#7ba2be] uppercase tracking-widest">
                  2. Chọn Phe Phái (Bắt buộc)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Option: RANDOM */}
                  <button
                    onClick={() => {
                      setSelectedAlignment("RANDOM");
                      setSelectedCharName(null);
                    }}
                    className={`p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                      "RANDOM" === selectedAlignment
                        ? "bg-[#4437ac]/20 border-[#7ba2be] shadow-[0_0_15px_rgba(68,55,172,0.3)]"
                        : "bg-[#030408]/80 border-[#4437ac]/20 hover:border-[#4437ac]/60"
                    }`}
                  >
                    <span className={`block font-black text-xs uppercase tracking-wide group-hover:text-white transition-colors ${
                      "RANDOM" === selectedAlignment ? "text-white" : "text-neutral-400"
                    }`}>
                      Ngẫu nhiên
                    </span>
                    <span className="block text-[9px] text-neutral-500 mt-1 leading-normal font-medium">
                      Hệ thống tự động phân vai ngẫu nhiên.
                    </span>
                  </button>

                  {/* Option: SHADOW */}
                  <button
                    onClick={() => {
                      setSelectedAlignment(Alignment.SHADOW);
                      setSelectedCharName(null);
                    }}
                    className={`p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                      Alignment.SHADOW === selectedAlignment
                        ? "bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        : "bg-[#030408]/80 border-[#4437ac]/20 hover:border-red-500/40"
                    }`}
                  >
                    <span className={`block font-black text-xs uppercase tracking-wide group-hover:text-red-400 transition-colors ${
                      Alignment.SHADOW === selectedAlignment ? "text-red-400" : "text-neutral-400"
                    }`}>
                      Shadow
                    </span>
                    <span className="block text-[9px] text-neutral-500 mt-1 leading-normal font-medium">
                      Thuộc phe Bóng tối khát máu.
                    </span>
                  </button>

                  {/* Option: HUNTER */}
                  <button
                    onClick={() => {
                      setSelectedAlignment(Alignment.HUNTER);
                      setSelectedCharName(null);
                    }}
                    className={`p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                      Alignment.HUNTER === selectedAlignment
                        ? "bg-sky-500/10 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                        : "bg-[#030408]/80 border-[#4437ac]/20 hover:border-sky-500/40"
                    }`}
                  >
                    <span className={`block font-black text-xs uppercase tracking-wide group-hover:text-sky-400 transition-colors ${
                      Alignment.HUNTER === selectedAlignment ? "text-sky-400" : "text-neutral-400"
                    }`}>
                      Hunter
                    </span>
                    <span className="block text-[9px] text-neutral-500 mt-1 leading-normal font-medium">
                      Thợ săn bảo vệ công lý loài người.
                    </span>
                  </button>

                  {/* Option: NEUTRAL */}
                  <button
                    onClick={() => {
                      setSelectedAlignment(Alignment.NEUTRAL);
                      setSelectedCharName(null);
                    }}
                    className={`p-3 rounded-xl border transition-all text-left cursor-pointer group ${
                      Alignment.NEUTRAL === selectedAlignment
                        ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                        : "bg-[#030408]/80 border-[#4437ac]/20 hover:border-amber-500/40"
                    }`}
                  >
                    <span className={`block font-black text-xs uppercase tracking-wide group-hover:text-amber-400 transition-colors ${
                      Alignment.NEUTRAL === selectedAlignment ? "text-amber-400" : "text-neutral-400"
                    }`}>
                      Neutral
                    </span>
                    <span className="block text-[9px] text-neutral-500 mt-1 leading-normal font-medium">
                      Nhân vật trung lập có mục tiêu riêng.
                    </span>
                  </button>
                </div>
              </div>

              {/* Option 3: Chọn nhân vật (Bị khóa cho đến khi chọn phe) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-black text-[#7ba2be] uppercase tracking-widest">
                  3. Chọn Nhân Vật
                </label>

                {"RANDOM" === selectedAlignment ? (
                  /* Phe ngẫu nhiên -> Chọn nhân vật tự động */
                  <div className="border border-dashed border-[#4437ac]/20 rounded-2xl p-6 bg-[#030408]/40 text-center">
                    <p className="text-xs text-neutral-500 italic">
                      🎲 Nhân vật sẽ được hệ thống phân bổ ngẫu nhiên từ mọi phe phái.
                    </p>
                  </div>
                ) : (
                  /* Phe cụ thể -> Cho phép chọn nhân vật */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                    {/* Option: Ngẫu nhiên trong phe */}
                    <button
                      onClick={() => setSelectedCharName(null)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        null === selectedCharName
                          ? "bg-[#4437ac]/10 border-[#7ba2be] shadow-inner"
                          : "bg-[#030408]/80 border-[#4437ac]/20 hover:border-[#4437ac]/60"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-black text-xs text-white">🎲 Ngẫu nhiên trong phe</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal">
                        Bắt đầu trận đấu với một nhân vật bất kỳ thuộc phe đã chọn ở trên.
                      </p>
                    </button>

                    {/* Lọc nhân vật theo phe được chọn */}
                    {CHARACTERS.filter(c => c.alignment === selectedAlignment).map(char => {
                      const isSelected = selectedCharName === char.name;
                      const borderCol = Alignment.SHADOW === selectedAlignment ? "hover:border-red-500/50" :
                                        Alignment.HUNTER === selectedAlignment ? "hover:border-sky-500/50" :
                                        "hover:border-amber-500/50";
                      const borderSelected = Alignment.SHADOW === selectedAlignment ? "border-red-500 bg-red-500/5 shadow-inner" :
                                             Alignment.HUNTER === selectedAlignment ? "border-sky-500 bg-sky-500/5 shadow-inner" :
                                             "border-amber-500 bg-amber-500/5 shadow-inner";
                      return (
                        <button
                          key={char.name}
                          onClick={() => setSelectedCharName(char.name)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all space-y-1.5 ${
                            isSelected
                              ? borderSelected
                              : `bg-[#030408]/80 border-[#4437ac]/20 ${borderCol}`
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-black text-xs text-white">{char.name}</span>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-neutral-800 text-neutral-300">
                              HP: {char.hp}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-black uppercase text-[#7ba2be] block">
                              Kỹ năng: {char.abilityName}
                            </span>
                            <p className="text-[9px] text-neutral-400 leading-normal mt-0.5 font-medium">
                              {char.abilityDesc}
                            </p>
                          </div>
                          <div className="pt-1.5 border-t border-white/5">
                            <span className="text-[8px] text-neutral-500 block leading-normal italic font-medium">
                              Mục tiêu: {char.winCondition}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => {
                  setShowConfirmBotModal(false);
                  // Khôi phục mặc định
                  setSelectedPlayerCount(4);
                  setSelectedAlignment("RANDOM");
                  setSelectedCharName(null);
                }}
                className="flex-1 py-3 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 rounded-xl transition-all cursor-pointer active:scale-98"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => {
                  setShowConfirmBotModal(false);
                  onStartSoloGame(
                    selectedCharName || undefined,
                    selectedPlayerCount,
                    "RANDOM" === selectedAlignment ? undefined : selectedAlignment
                  );
                }}
                className="flex-1 py-3 bg-gradient-to-r from-[#4437ac] to-[#5b4fcd] hover:from-[#5b4fcd] hover:to-[#7ba2be] text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer active:scale-98"
              >
                Vào Trận
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL NHẬP TÊN CÁ NHÂN ================= */}
      {showNameInputModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0a0c16]/95 border border-[#4437ac]/50 p-6 rounded-3xl w-full max-w-sm shadow-[0_0_30px_rgba(68,55,172,0.4)] space-y-5 animate-slideUp">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 bg-[#4437ac]/20 border border-[#7ba2be]/20 rounded-2xl text-[#7ba2be] mb-1 mx-auto">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-white font-black text-sm uppercase tracking-wide">
                Nhập Tên Cá Nhân
              </h3>
              <p className="text-xs text-neutral-400 leading-normal">
                Vui lòng cung cấp biệt danh của bạn để tham gia vào phòng chơi.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#7ba2be]/60">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={tempPlayerName}
                  onChange={(e) => setTempPlayerName(e.target.value.slice(0, 50))}
                  placeholder="Nhập biệt danh nhân vật..."
                  maxLength={50}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#030408]/90 border border-[#4437ac]/50 focus:border-[#7ba2be] focus:ring-1 focus:ring-[#7ba2be]/40 rounded-xl text-white placeholder-neutral-600 focus:outline-none transition-all text-xs font-semibold"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setShowNameInputModal(false);
                  setPendingRoomAction(null);
                  setErrorMsg("");
                }}
                className="flex-1 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 rounded-xl transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleConfirmName}
                disabled={submitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-[#4437ac] to-[#5b4fcd] hover:from-[#5b4fcd] hover:to-[#7ba2be] disabled:opacity-50 text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center"
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INFO CHOOSER MODAL ================= */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div
            onClick={() => setShowInfoModal(false)}
            className="fixed inset-0 z-40"
          />
          <div className="relative z-50 bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 animate-slideUp space-y-4">
            <h3 className="text-lg font-bold text-white text-center tracking-tight">
              Thông tin
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  onOpenRules();
                }}
                className="w-full text-left py-3 px-4 bg-neutral-800/60 hover:bg-neutral-800 rounded-xl text-sm font-bold text-neutral-200 transition-all flex items-center gap-3 cursor-pointer border border-neutral-700/50"
              >
                <BookOpen className="w-5 h-5 text-[#7BA2BE]" />
                Luật chơi
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  onOpenCharacterList();
                }}
                className="w-full text-left py-3 px-4 bg-neutral-800/60 hover:bg-neutral-800 rounded-xl text-sm font-bold text-neutral-200 transition-all flex items-center gap-3 cursor-pointer border border-neutral-700/50"
              >
                <Shield className="w-5 h-5 text-[#7BA2BE]" />
                Danh sách nhân vật
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  onOpenEquipmentList();
                }}
                className="w-full text-left py-3 px-4 bg-neutral-800/60 hover:bg-neutral-800 rounded-xl text-sm font-bold text-neutral-200 transition-all flex items-center gap-3 cursor-pointer border border-neutral-700/50"
              >
                <Shield className="w-5 h-5 text-[#7BA2BE]" />
                Danh sách trang bị
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  onOpenCardList();
                }}
                className="w-full text-left py-3 px-4 bg-neutral-800/60 hover:bg-neutral-800 rounded-xl text-sm font-bold text-neutral-200 transition-all flex items-center gap-3 cursor-pointer border border-neutral-700/50"
              >
                <Sparkles className="w-5 h-5 text-[#7BA2BE]" />
                Danh sách thẻ bài
              </button>
            </div>
            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-bold text-neutral-300 transition-all cursor-pointer border border-neutral-700/50"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
