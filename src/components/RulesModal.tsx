import React from "react";
import { X, BookOpen, Swords, Shield, Heart, HelpCircle } from "lucide-react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RulesModal({ isOpen, onClose }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div 
        id="rules_modal_container"
        className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl relative text-gray-200"
      >
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2 text-rose-500">
            <BookOpen className="w-6 h-6" />
            <h2 className="text-xl font-bold font-sans tracking-tight">Học Thuyết & Luật Chơi Shadow Hunters</h2>
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
              <strong className="text-white">Shadow Hunters</strong> là game Board Game nhập vai ẩn vai huyền bí. 
              Mỗi người chơi bắt đầu trận đấu với một vai trò ẩn thuộc 1 trong 3 thế lực: 
              <span className="text-red-400 font-semibold"> Shadow (Bóng Tối)</span>, 
              <span className="text-blue-400 font-semibold"> Hunter (Thợ Săn)</span>, hoặc 
              <span className="text-amber-400 font-semibold"> Neutral (Trung Lập)</span>. 
              Bạn phải dò hỏi danh tính của người khác, tìm ra đồng minh, mài sắc vũ khí và tiêu diệt kẻ thù để giành chiến thắng.
            </p>
          </section>

          {/* Ba phe phái */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">2. Ba Phe Phái</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  PHE SHADOW (BÓNG TỐI)
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Là những thực thể tà ác ẩn nấp trong màn đêm (Vampire, Werewolf,...).
                </p>
                <div className="text-xs text-red-300 font-medium pt-1">
                  🎯 Mục tiêu: Tiêu diệt toàn bộ Hunter, hoặc tiêu diệt bất kỳ 3 người chơi nào.
                </div>
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  PHE HUNTER (THỢ SĂN)
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Đội quân chính nghĩa chiến đấu bảo vệ loài người khỏi ma quỷ phương xa.
                </p>
                <div className="text-xs text-blue-300 font-medium pt-1">
                  🎯 Mục tiêu: Truy vết và tiêu diệt toàn bộ thành viên của phe Shadow.
                </div>
              </div>

              <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  PHE NEUTRAL (TRUNG LẬP)
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Những người dân thường vô tội bị cuốn vào cuộc thánh chiến, có dã tâm riêng.
                </p>
                <div className="text-xs text-amber-300 font-medium pt-1">
                  🎯 Mục tiêu: Biến động theo từng nhân vật (Sống sót, thu thập trang bị, hoặc làm người chết đầu tiên).
                </div>
              </div>

            </div>
          </section>

          {/* Tiến trình lượt chơi */}
          <section className="space-y-3 text-sm">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">3. Tiến Trình Một Lượt Chơi</h3>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">1</div>
                <div>
                  <strong className="text-white">Di chuyển (Bắt buộc):</strong> Đổ đồng thời xúc xắc 6 cạnh (D6) và xúc xắc 4 cạnh (D4). Di chuyển token của bạn đến Địa điểm có số tương ứng với tổng điểm xúc xắc nhận được. 
                  <ul className="list-disc pl-5 mt-1 text-xs text-neutral-400 space-y-1">
                    <li>Nếu đổ ra tổng điểm trùng với Địa điểm bạn đang đứng, bạn bắt buộc phải lắc lại xúc xắc cho tới khi ra địa điểm mới.</li>
                    <li>Nếu đổ ra điểm 7 may mắn, bạn được phép chọn bay tự do đến bất kỳ địa điểm nào tùy ý (trừ địa điểm hiện tại).</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">2</div>
                <div>
                  <strong className="text-white">Thực hiện hành động địa điểm (Không bắt buộc):</strong> Kích hoạt hiệu ứng thần bí của ô đất bạn vừa đặt chân tới:
                  <ul className="list-disc pl-5 mt-1 text-xs text-neutral-400 space-y-1">
                    <li><strong className="text-green-400">Lều Ẩn Sĩ:</strong> Rút thẻ Ẩn Sĩ và đưa bí mật cho 1 đối thủ để kiểm tra vai trò của họ.</li>
                    <li><strong className="text-blue-400">Suối Nguồn / Nhà Thờ:</strong> Rút bài Ánh Sáng để tăng cường vũ khí phòng vệ hoặc hồi máu.</li>
                    <li><strong className="text-orange-400">Nghĩa Địa / Đe Hắc Ám:</strong> Rút bài Bóng Tối để sở hữu kiếm rìu tàn bạo, độc dược hắc ám.</li>
                    <li><strong className="text-red-400">Rừng Rậm Kỳ Dị:</strong> Trực tiếp gây 2 sát thương hoặc hồi 1 HP cho bất cứ ai.</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-xs text-white shrink-0 mt-0.5">3</div>
                <div>
                  <strong className="text-white">Tấn công (Không bắt buộc):</strong> Bạn có quyền khai chiến tấn công một người chơi bất kỳ <strong className="text-white">đang đứng ở cùng Khu vực</strong> với bạn.
                  <ul className="list-disc pl-5 mt-1 text-xs text-neutral-400 space-y-1">
                    <li>Bản đồ chia làm 3 Khu vực ghép đôi: Khu vực A (Lều Ẩn Sĩ & Suối Nguồn), Khu vực B (Nhà Thờ & Nghĩa Địa), Khu vực C (Đe Hắc Ám & Rừng Rậm).</li>
                    <li>Sát thương cơ bản bằng giá trị tuyệt đối hiệu xúc xắc: <strong className="text-rose-400">|D6 - D4|</strong>. Nếu bằng 0 thì đòn đánh hụt.</li>
                    <li>Sát thương thực nhận cộng trừ thêm các chỉ số vũ khí trang bị đang mang.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Tiết lộ thân phận */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">4. Tiết Lộ Thân Phận & Kỹ Năng Nhân Vật</h3>
            <p className="text-neutral-300 leading-relaxed text-sm">
              Vào bất kỳ lúc nào trong lượt của mình, bạn có quyền <span className="text-rose-400 font-semibold">"Tiết Lộ Thân Phận" (Reveal)</span> lật ngửa bài để kích hoạt siêu kỹ năng tối thượng của nhân vật. 
              Một số siêu năng lực mạnh mẽ chỉ được dùng 1 lần duy nhất sau khi lật ngửa vai trò (như Allie cứu rỗi hồi đầy máu, Franklin giật sét toàn bản đồ), do đó hãy cân nhắc lựa chọn thời điểm thích hợp để gây bất ngờ cho đối thủ!
            </p>
          </section>

          {/* Ý nghĩa trang bị tiêu biểu */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-rose-400 border-l-2 border-rose-500 pl-3">5. Các Thẻ Trang Bị Nổi Bật</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-blue-300 block mb-1">Thương Thánh (Trang bị Ánh Sáng)</strong>
                Hỗ trợ tăng +1 lực tấn công vật lý. Tuy nhiên, nếu là ma quỷ Shadow vô tình cầm phải, bạn lập tức mất 1 HP cực kỳ đau đớn và buộc phải ngửa bài!
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-orange-300 block mb-1">Rìu Tàn Sát (Trang bị Bóng Tối)</strong>
                Cung cấp chỉ số +2 sát thương cực khủng trên mỗi đòn đánh. Nhưng nếu đen đủi tung ra sát thương gốc nhỏ hơn 2, cây rìu khát máu sẽ phản tác dụng tự chém bạn mất 1 máu.
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-blue-300 block mb-1">Búp Bê May Mắn / Giáp Hộ Mệnh</strong>
                Các trang bị cứu cánh phòng thủ giúp bạn né tránh hoàn toàn sát thương từ thẻ bài tà thuật Bóng tối hoặc có cơ hội 50% né đòn đánh tay của địch.
              </div>
              <div className="bg-neutral-800/40 p-3 rounded-lg border border-neutral-700/40">
                <strong className="text-green-300 block mb-1">Thẻ Thẩm Vấn Ẩn Sĩ (Hermit Card)</strong>
                Những bức mật thư được chuyền tay âm thầm giúp bạn kiểm chứng xem đối phương có phải là kẻ thù cần tiêu diệt hay không để điều phối mục tiêu chuẩn xác.
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
