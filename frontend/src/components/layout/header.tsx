import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useAuth } from "../../context/AuthContext";
import { config } from "../../config/config";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "../ui/dropdown-menu";

export function Header() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold">하늘길</span>
        </Link>        <nav className="md:flex gap-6">
          <Link to="/flights" className="text-sm font-medium hover:underline">항공권 검색</Link>
          <Link to="/bookings" className="text-sm font-medium hover:underline">예약 관리</Link>
          {user?.cno === config.auth.adminCno && (
            <Link to="/admin" className="text-sm font-medium hover:underline">관리자</Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                    <AvatarImage src="" />
                    <AvatarFallback>{user?.name?.[0] || '회원'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel><b>{user?.name}</b>님 환영합니다.</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/user')}>
                    회원 정보
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button variant="outline" asChild>
              <Link to="/login">로그인</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
