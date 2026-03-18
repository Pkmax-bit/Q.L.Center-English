import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">E</span>
          </div>
          <span className="text-xl font-bold text-gray-900">English Center</span>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Đăng nhập
        </Link>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Hệ Thống Quản Lý<br />
            <span className="text-blue-600">Trung Tâm Tiếng Anh</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Giải pháp quản lý toàn diện cho trung tâm tiếng Anh. Quản lý lớp học, 
            giáo viên, học sinh, bài học và tài chính một cách hiệu quả.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-8 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
              <span className="text-2xl">👨‍💼</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Quản Trị Viên</h3>
            <p className="text-gray-600 text-sm">
              Quản lý toàn bộ hệ thống: giáo viên, học sinh, lớp học, tài chính và cơ sở vật chất.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
              <span className="text-2xl">👩‍🏫</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Giáo Viên</h3>
            <p className="text-gray-600 text-sm">
              Quản lý lớp học, tạo bài giảng, ra đề kiểm tra và chấm điểm học sinh.
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
              <span className="text-2xl">👨‍🎓</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Học Sinh</h3>
            <p className="text-gray-600 text-sm">
              Xem bài giảng, làm bài tập, kiểm tra trực tuyến và theo dõi kết quả học tập.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t bg-white/80 backdrop-blur-sm py-6 text-center text-sm text-gray-500">
        © 2024 English Center Management System. All rights reserved.
      </footer>
    </div>
  );
}
