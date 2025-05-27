import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">하늘길</span>
        </Link>
        {/* <nav className="md:flex gap-6">
          <Link to="/flights" className="text-sm font-medium hover:underline">항공권 검색</Link>
          <Link to="/about" className="text-sm font-medium hover:underline">서비스 안내</Link>
        </nav> */}
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link to="/login">로그인</Link>
          </Button>
          <Link to="/user">
            <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src="" />
              <AvatarFallback>회원</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
