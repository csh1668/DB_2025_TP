export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="grid sm:grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">하늘길</h3>
            <p className="text-sm text-gray-500">
              최고의 서비스와 안전한 비행을 약속드립니다.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">회사 정보</h4>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="text-gray-500 hover:text-gray-900">회사 소개</a></li>
              <li><a href="#" className="text-gray-500 hover:text-gray-900">채용 정보</a></li>
              <li><a href="#" className="text-gray-500 hover:text-gray-900">뉴스룸</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">고객 지원</h4>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="text-gray-500 hover:text-gray-900">예약 문의</a></li>
              <li><a href="#" className="text-gray-500 hover:text-gray-900">자주 묻는 질문</a></li>
              <li><a href="#" className="text-gray-500 hover:text-gray-900">고객센터</a></li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">법적 고지</h4>
            <ul className="text-sm space-y-1">
              <li><a href="#" className="text-gray-500 hover:text-gray-900">이용약관</a></li>
              <li><a href="#" className="text-gray-500 hover:text-gray-900">개인정보 처리방침</a></li>
              <li><a href="#" className="text-gray-500 hover:text-gray-900">쿠키 정책</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-6 border-t pt-6 text-center text-xs text-gray-500">
          © 2025 하늘길. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
