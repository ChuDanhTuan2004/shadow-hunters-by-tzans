import React from "react";
import { X, BookOpen, Swords, Shield, Heart, HelpCircle } from "lucide-react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        id="rules_modal_container"
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl relative text-gray-200 cursor-default"
      >
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-rose-500">
            <BookOpen className="w-6 h-6" />
            <h2 className="text-xl font-bold font-sans tracking-tight">Học Thuyết &amp; Luật Chơi Shadow Hunters</h2>
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
          
          {/* Giới thiệu */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">1. Tổng Quan Trò Chơi</h3>
            <p className="text-neutral-300 leading-relaxed text-sm">
              <strong className="text-white">Shadow Hunters</strong> là board game nhập vai với cơ chế ẩn danh đậm chất huyền bí.
              Mỗi người chơi nhận một vai trò bí ẩn thuộc một trong ba thế lực:{" "}
              <span className="text-red-400 font-semibold">Shadow (Bóng Tối)</span>,{" "}
              <span className="text-blue-400 font-semibold">Hunter (Thợ Săn)</span>, hoặc{" "}
              <span className="text-amber-400 font-semibold">Neutral (Trung Lập)</span>.
              Hãy dò xét danh tính đối thủ, tìm kiếm đồng minh, thu thập vũ khí và triệt hạ kẻ thù để giành chiến thắng.
            </p>
          </section>

          {/* Ba phe phái */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">2. Ba Phe Phái</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  SHADOW (BÓNG TỐI)
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Những thực thể tà ác ẩn mình trong màn đêm tăm tối (Vampire, Werewolf…).
                </p>
                <div className="text-xs text-red-300 font-medium pt-1">
                  🎯 Chiến thắng khi: Tiêu diệt toàn bộ Hunter, hoặc có ít nhất 3 người Neutral đã chết.
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  HUNTER (THỢ SĂN)
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Đội quân chính nghĩa chiến đấu vì loài người, ngăn chặn bóng tối tràn lan.
                </p>
                <div className="text-xs text-blue-300 font-medium pt-1">
                  🎯 Chiến thắng khi: Truy tìm và tiêu diệt toàn bộ thành viên phe Shadow.
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  NEUTRAL (TRUNG LẬP)
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Những con người bình thường bị cuốn vào cuộc chiến, mỗi người mang một tham vọng riêng.
                </p>
                <div className="text-xs text-amber-300 font-medium pt-1">
                  🎯 Điều kiện chiến thắng theo từng nhân vật:
                </div>
                <ul className="text-[11px] text-amber-200/80 space-y-0.5 list-disc pl-4">
                  <li><strong>Allie:</strong> Sống sót đến khi trò chơi kết thúc.</li>
                  <li><strong>Bob:</strong> Sở hữu từ 3 trang bị trở lên.</li>
                  <li><strong>Charles:</strong> Tự tay kết liễu người chết thứ 3 trở đi của toàn trận.</li>
                  <li><strong>Daniel:</strong> Là người chết đầu tiên, hoặc sống sót khi phe Hunter thắng.</li>
                  <li><strong>Bryan:</strong> Hạ gục người có HP tối đa ≥ 13, hoặc đang ở Bàn Thờ Cổ khi game kết thúc.</li>
                  <li><strong>Catherine:</strong> Là người chết đầu tiên, hoặc lọt vào 2 người sống sót cuối cùng.</li>
                  <li><strong>David:</strong> Sở hữu từ 3 thánh tích trở lên (Bùa Hộ Mệnh, Thương Longinus, Thánh Bào, Chuỗi Hạt Bạc).</li>
                  <li><strong>Agnes:</strong> Người chơi ngồi phía sau mình (theo chiều lượt) giành chiến thắng.</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Tiến trình lượt chơi */}
          <section className="space-y-3 text-sm">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">3. Diễn Tiến Một Lượt Chơi</h3>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">1</div>
                <div>
                  <strong className="text-white">Di chuyển (Bắt buộc):</strong> Tung đồng thời xúc xắc 6 mặt (D6) và xúc xắc 4 mặt (D4). Di chuyển quân cờ đến Địa điểm có số tương ứng với tổng điểm vừa tung.
                  <ul className="list-disc pl-5 mt-1 text-xs text-neutral-400 space-y-1">
                    <li>Nếu tổng điểm trùng với Địa điểm đang đứng, tung lại (tối đa 5 lần) cho đến khi ra địa điểm mới.</li>
                    <li>Nếu tung ra tổng điểm <strong className="text-yellow-400">7</strong>, bạn được tự do chọn di chuyển đến bất kỳ địa điểm nào (trừ địa điểm hiện tại).</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">2</div>
                <div>
                  <strong className="text-white">Kích hoạt địa điểm (Không bắt buộc):</strong> Thực hiện hiệu ứng của ô đất vừa đặt chân đến:
                  <ul className="list-disc pl-5 mt-1 text-xs text-neutral-400 space-y-1">
                    <li><strong className="text-green-400">Lều Ẩn Sĩ (Hermit's Cabin):</strong> Rút thẻ Ẩn Sĩ, đọc thầm nội dung rồi trao cho một người chơi khác.</li>
                    <li><strong className="text-purple-400">Cổng Âm Phủ (Underworld Gate):</strong> Chọn rút từ một trong ba bộ bài: Ẩn Sĩ, Ánh Sáng hoặc Bóng Tối.</li>
                    <li><strong className="text-blue-400">Nhà Thờ (Church):</strong> Rút một thẻ Ánh Sáng.</li>
                    <li><strong className="text-orange-400">Nghĩa Địa (Cemetery):</strong> Rút một thẻ Bóng Tối.</li>
                    <li><strong className="text-red-400">Rừng Quái Dị (Weird Woods):</strong> Chọn một người chơi: gây 2 sát thương hoặc hồi 1 HP cho họ.</li>
                    <li><strong className="text-amber-400">Bàn Thờ Cổ (Erstwhile Altar):</strong> Cướp một trang bị từ bất kỳ người chơi nào khác.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">3</div>
                <div>
                  <strong className="text-white">Tấn công (Không bắt buộc):</strong> Bạn có thể tấn công một người chơi bất kỳ <strong className="text-white">đang ở cùng Khu vực</strong> với mình.
                  <ul className="list-disc pl-5 mt-1 text-xs text-neutral-400 space-y-1">
                    <li>Bản đồ gồm 3 Khu vực ghép đôi: Khu vực A (Lều Ẩn Sĩ &amp; Cổng Âm Phủ), Khu vực B (Nhà Thờ &amp; Nghĩa Địa), Khu vực C (Rừng Quái Dị &amp; Bàn Thờ Cổ).</li>
                    <li>Sát thương cơ bản = giá trị tuyệt đối của hiệu số hai xúc xắc: <strong className="text-rose-400">|D6 − D4|</strong>. Kết quả bằng 0 nghĩa là đòn đánh hụt.</li>
                    <li>Sát thương thực nhận được điều chỉnh thêm hoặc bớt bởi chỉ số trang bị đang mang.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Tiết lộ thân phận */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">4. Lộ Diện &amp; Kỹ Năng Nhân Vật</h3>
            <p className="text-neutral-300 leading-relaxed text-sm">
              Vào bất kỳ lúc nào trong lượt của mình, bạn có thể chủ động <span className="text-rose-400 font-semibold">Lộ Diện (Reveal)</span> — lật ngửa thẻ nhân vật để kích hoạt kỹ năng đặc biệt (thường chỉ dùng được một lần).
              Ngoài ra, thân phận có thể bị buộc lộ trong các trường hợp: khi chết, bị Thương Longinus chỉ định, bị Bùa Soi Gương, hoặc bị kỹ năng Thánh Quang của Ilumia chiếu rọi.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300 mt-3">
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-rose-300 block mb-1">Allie — Ước Nguyện</strong>
                Hồi phục hoàn toàn HP về mức tối đa (chỉ dùng một lần).
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-rose-300 block mb-1">Franklin — Phóng Sét</strong>
                Gây 4 sát thương cố định lên một mục tiêu tùy chọn (chỉ dùng một lần).
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-rose-300 block mb-1">Ilumia — Thánh Quang</strong>
                Buộc toàn bộ Shadow lộ diện và gây 3 sát thương lên tất cả họ (chỉ dùng một lần).
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-rose-300 block mb-1">Gregor — Áo Giáp Thép</strong>
                Vô hiệu hóa mọi sát thương nhận vào cho đến đầu lượt kế tiếp (chỉ dùng một lần).
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-rose-300 block mb-1">Vampire — Hút Máu</strong>
                Mỗi khi gây sát thương thành công, hồi 2 HP cho bản thân.
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-rose-300 block mb-1">Các kỹ năng khác</strong>
                Ellen (phong ấn vĩnh viễn), Mganga (tẩm độc), Fuka (ấn định sát thương = 7), Wight (nhận thêm lượt theo số người chết)…
              </div>
            </div>
          </section>

          {/* Trang bị nổi bật */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">5. Trang Bị Đáng Chú Ý</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-blue-300 block mb-1">Thương Longinus (Spear of Longinus)</strong>
                Dành cho Hunter: đòn đánh trúng gây thêm +2 sát thương và có thể buộc mục tiêu lộ diện danh tính.
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-orange-300 block mb-1">Dao Đồ Tể / Cưa Máy / Rìu Rỉ Sét (Vũ khí Bóng Tối)</strong>
                Mỗi loại trang bị tăng +1 sát thương cho mỗi đòn đánh thành công.
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-blue-300 block mb-1">Cài Áo May Mắn (Fortune Brooch) / Thánh Bào (Holy Robe)</strong>
                <span className="block mt-0.5"><em>Cài Áo May Mắn:</em> Miễn nhiễm toàn bộ sát thương từ Rừng Quái Dị.</span>
                <span className="block mt-0.5"><em>Thánh Bào:</em> Mọi đòn đánh của bạn giảm 1 sát thương, đồng thời bạn cũng chịu ít hơn 1 sát thương từ đòn tấn công.</span>
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-green-300 block mb-1">Thẻ Ẩn Sĩ (Hermit Card)</strong>
                Người trao đọc thầm nội dung rồi chọn tặng cho một người khác. Hiệu ứng kích hoạt phụ thuộc vào phe của người nhận: có thể gây sát thương, hồi máu, cướp trang bị hoặc buộc lộ diện. Nhân vật Unknown (Bóng Ma Vô Diện) có thể khai gian để vô hiệu hóa hiệu ứng thẻ.
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 px-6 py-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-rose-950/20"
          >
            Đã Hiểu Luật Chơi
          </button>
        </div>
      </div>
    </div>
  );
}
