import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import LucideIcon from "@/components/icons/lucideIcon";
import UserForm from "@/components/forms/userForm";
import FlightForm from "@/components/forms/flightForm";

// 임시 사용자 목록
const temporaryUsers = [
  {
    id: "user123",
    name: "홍길동",
    email: "hong@example.com",
    phone: "010-1234-5678",
    passportNumber: "M12345678",
    nationality: "대한민국",
    registeredAt: "2025-01-15",
    status: "active", // active, suspended, dormant
    bookings: 3,
  },
  {
    id: "user456",
    name: "김철수",
    email: "kim@example.com",
    phone: "010-2345-6789",
    passportNumber: "M23456789",
    nationality: "대한민국",
    registeredAt: "2025-02-20",
    status: "active",
    bookings: 1,
  },
  {
    id: "user789",
    name: "이영희",
    email: "lee@example.com",
    phone: "010-3456-7890",
    passportNumber: "M34567890",
    nationality: "대한민국",
    registeredAt: "2025-03-10",
    status: "suspended",
    bookings: 0,
  },
  {
    id: "user012",
    name: "박민수",
    email: "park@example.com",
    phone: "010-4567-8901",
    passportNumber: "M45678901",
    nationality: "대한민국",
    registeredAt: "2025-04-05",
    status: "dormant",
    bookings: 5,
  },
  {
    id: "user345",
    name: "최지영",
    email: "choi@example.com",
    phone: "010-5678-9012",
    passportNumber: "M56789012",
    nationality: "대한민국",
    registeredAt: "2025-05-12",
    status: "active",
    bookings: 2,
  },
];

// 임시 항공편 목록
const temporaryFlights = [
  {
    id: 1,
    flightCode: "KE123",
    airline: "대한항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "NRT",
    arrivalCity: "도쿄",
    departureTime: "08:30",
    arrivalTime: "11:00",
    duration: "2시간 30분",
    date: "2025-06-15",
    businessPrice: 550000,
    economyPrice: 250000,
    businessSeatsTotal: 20,
    economySeatsTotal: 180,
    businessSeatsAvailable: 10,
    economySeatsAvailable: 150,
    status: "scheduled", // scheduled, delayed, cancelled
  },
  {
    id: 2,
    flightCode: "OZ456",
    airline: "아시아나항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "HND",
    arrivalCity: "도쿄",
    departureTime: "10:15",
    arrivalTime: "12:45",
    duration: "2시간 30분",
    date: "2025-06-15",
    businessPrice: 530000,
    economyPrice: 240000,
    businessSeatsTotal: 16,
    economySeatsTotal: 160,
    businessSeatsAvailable: 8,
    economySeatsAvailable: 120,
    status: "scheduled",
  },
  {
    id: 3,
    flightCode: "7C890",
    airline: "제주항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "KIX",
    arrivalCity: "오사카",
    departureTime: "13:00",
    arrivalTime: "15:30",
    duration: "2시간 30분",
    date: "2025-06-16",
    businessPrice: 0,
    economyPrice: 180000,
    businessSeatsTotal: 0,
    economySeatsTotal: 200,
    businessSeatsAvailable: 0,
    economySeatsAvailable: 180,
    status: "scheduled",
  },
  {
    id: 4,
    flightCode: "KE789",
    airline: "대한항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "BKK",
    arrivalCity: "방콕",
    departureTime: "16:45",
    arrivalTime: "20:30",
    duration: "5시간 45분",
    date: "2025-06-18",
    businessPrice: 850000,
    economyPrice: 420000,
    businessSeatsTotal: 24,
    economySeatsTotal: 200,
    businessSeatsAvailable: 12,
    economySeatsAvailable: 140,
    status: "delayed",
  },
  {
    id: 5,
    flightCode: "TW789",
    airline: "티웨이항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "CTS",
    arrivalCity: "삿포로",
    departureTime: "19:30",
    arrivalTime: "22:00",
    duration: "2시간 30분",
    date: "2025-06-20",
    businessPrice: 0,
    economyPrice: 190000,
    businessSeatsTotal: 0,
    economySeatsTotal: 220,
    businessSeatsAvailable: 0,
    economySeatsAvailable: 200,
    status: "cancelled",
  },
];

// 상태 레이블 컴포넌트
function StatusBadge({ status }: { status: string }) {
  let badgeClasses = "px-2 py-1 text-xs rounded-full ";
  
  switch (status) {
    case "active":
      badgeClasses += "bg-green-100 text-green-800";
      return <span className={badgeClasses}>활성</span>;
    case "suspended":
      badgeClasses += "bg-red-100 text-red-800";
      return <span className={badgeClasses}>정지됨</span>;
    case "dormant":
      badgeClasses += "bg-gray-100 text-gray-800";
      return <span className={badgeClasses}>휴면</span>;
    case "scheduled":
      badgeClasses += "bg-blue-100 text-blue-800";
      return <span className={badgeClasses}>예정됨</span>;
    case "delayed":
      badgeClasses += "bg-yellow-100 text-yellow-800";
      return <span className={badgeClasses}>지연됨</span>;
    case "cancelled":
      badgeClasses += "bg-red-100 text-red-800";
      return <span className={badgeClasses}>취소됨</span>;
    default:
      return <span className={badgeClasses}>{status}</span>;
  }
}

// 사용자 추가 폼 타입 정의
type UserFormValues = {
  name: string;
  email: string;
  phone: string;
  passport: string;
  nationality: string;
  status?: string;
};

// 항공편 폼 타입 정의
type FlightFormValues = {
  flightCode: string;
  airline: string;
  departureAirport: string;
  arrivalAirport: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  economyPrice: number;
  businessPrice: number;
  economySeats: number;
  businessSeats: number;
  status?: string;
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  
  // 사용자 필터링
  const filteredUsers = temporaryUsers.filter(user => {
    const matchesSearch = 
      user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  // 항공편 필터링
  const filteredFlights = temporaryFlights.filter(flight => {
    const matchesSearch = 
      flight.flightCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.airline.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.departureCity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.arrivalCity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || flight.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 관리자 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LucideIcon name="Shield" className="h-8 w-8 text-primary" />
          관리자 대시보드
        </h1>
        <p className="text-muted-foreground">
          사용자 정보와 항공편을 관리합니다.
        </p>
      </div>
      
      {/* 탭 네비게이션 */}
      <Tabs defaultValue="users" onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="mb-0">
            <TabsTrigger value="users" className="flex items-center gap-1">
              <LucideIcon name="Users" className="h-4 w-4" /> 사용자 관리
            </TabsTrigger>
            <TabsTrigger value="flights" className="flex items-center gap-1">
              <LucideIcon name="Plane" className="h-4 w-4" /> 항공편 관리
            </TabsTrigger>
          </TabsList>
          
          <div className="flex flex-wrap gap-2 items-center">
            {/* 검색 필드 */}
            <div className="relative">
              <LucideIcon name="Search" className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={
                  activeTab === "users" 
                    ? "사용자 ID, 이름 또는 이메일 검색" 
                    : "항공편 코드, 항공사 또는 도시 검색"
                }
                className="pl-9 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* 필터 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="상태 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">모든 상태</SelectItem>
                  {activeTab === "users" ? (
                    <>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="suspended">정지됨</SelectItem>
                      <SelectItem value="dormant">휴면</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="scheduled">예정됨</SelectItem>
                      <SelectItem value="delayed">지연됨</SelectItem>
                      <SelectItem value="cancelled">취소됨</SelectItem>
                    </>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 사용자 관리 탭 */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              총 {filteredUsers.length}명의 사용자가 검색되었습니다.
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1">
                  <LucideIcon name="UserPlus" className="h-4 w-4" />
                  사용자 추가
                </Button>
              </DialogTrigger>              <DialogContent>
                <DialogHeader>
                  <DialogTitle>사용자 추가</DialogTitle>
                  <DialogDescription>
                    새로운 사용자를 시스템에 추가합니다.
                  </DialogDescription>
                </DialogHeader>
                <UserForm onSubmit={(data) => console.log("사용자 추가:", data)} />
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>이름</TableHead>
                    <TableHead>이메일</TableHead>
                    <TableHead>전화번호</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>예약 수</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.id}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>{user.registeredAt}</TableCell>
                      <TableCell>{user.bookings}</TableCell>
                      <TableCell>
                        <StatusBadge status={user.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <LucideIcon name="LocationEdit" className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>사용자 정보 수정</DialogTitle>
                                <DialogDescription>
                                  {user.name}({user.id}) 회원의 정보를 수정합니다.
                                </DialogDescription>
                              </DialogHeader>                              <UserForm 
                                defaultValues={{
                                  name: user.name,
                                  email: user.email,
                                  phone: user.phone,
                                  passportNumber: user.passportNumber,
                                  nationality: user.nationality,
                                  status: user.status as "active" | "suspended" | "dormant",
                                }} 
                                onSubmit={(values) => {
                                  console.log("사용자 업데이트:", values);
                                  // 여기에 API 호출 로직 추가
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <LucideIcon name="UserX" className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>사용자 탈퇴 처리</DialogTitle>
                                <DialogDescription>
                                  {user.name}({user.id}) 회원을 탈퇴 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex items-center space-x-2 my-4">
                                <Checkbox id="confirm" />
                                <label
                                  htmlFor="confirm"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  이 작업이 되돌릴 수 없음을 이해했습니다.
                                </label>
                              </div>
                              <DialogFooter>
                                <Button variant="outline">취소</Button>
                                <Button variant="destructive">탈퇴 처리</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 항공편 관리 탭 */}
        <TabsContent value="flights" className="space-y-6">
          <div className="flex justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              총 {filteredFlights.length}개의 항공편이 검색되었습니다.
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-1">
                  <LucideIcon name="PlaneTakeoff" className="h-4 w-4" />
                  항공편 추가
                </Button>
              </DialogTrigger>              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>항공편 추가</DialogTitle>
                  <DialogDescription>
                    새로운 항공편을 시스템에 추가합니다.
                  </DialogDescription>
                </DialogHeader>
                <FlightForm 
                  onSubmit={(values) => {
                    console.log("항공편 추가:", values);
                    // 여기에 API 호출 로직 추가
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>코드</TableHead>
                    <TableHead>항공사</TableHead>
                    <TableHead>출발</TableHead>
                    <TableHead>도착</TableHead>
                    <TableHead>날짜</TableHead>
                    <TableHead>시간</TableHead>
                    <TableHead>이코노미석</TableHead>
                    <TableHead>비즈니스석</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-right">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFlights.map((flight) => (
                    <TableRow key={flight.id}>
                      <TableCell className="font-medium">{flight.flightCode}</TableCell>
                      <TableCell>{flight.airline}</TableCell>
                      <TableCell>{flight.departureAirport}</TableCell>
                      <TableCell>{flight.arrivalAirport}</TableCell>
                      <TableCell>{flight.date}</TableCell>
                      <TableCell>{flight.departureTime} - {flight.arrivalTime}</TableCell>
                      <TableCell>
                        {flight.economySeatsAvailable}/{flight.economySeatsTotal}
                        <div className="text-xs text-muted-foreground">
                          {flight.economyPrice.toLocaleString()}원
                        </div>
                      </TableCell>
                      <TableCell>
                        {flight.businessSeatsAvailable}/{flight.businessSeatsTotal}
                        <div className="text-xs text-muted-foreground">
                          {flight.businessPrice ? flight.businessPrice.toLocaleString() + '원' : '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={flight.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <LucideIcon name="LocationEdit" className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>항공편 정보 수정</DialogTitle>
                                <DialogDescription>
                                  {flight.airline} {flight.flightCode} ({flight.date}) 항공편의 정보를 수정합니다.
                                </DialogDescription>
                              </DialogHeader>                              <FlightForm 
                                defaultValues={{
                                  flightCode: flight.flightCode,
                                  airline: flight.airline,
                                  departureAirport: flight.departureAirport,
                                  departureCity: flight.departureCity,
                                  arrivalAirport: flight.arrivalAirport,
                                  arrivalCity: flight.arrivalCity,
                                  date: flight.date,
                                  departureTime: flight.departureTime,
                                  arrivalTime: flight.arrivalTime,
                                  economyPrice: flight.economyPrice,
                                  businessPrice: flight.businessPrice || 0,
                                  economySeatsTotal: flight.economySeatsTotal,
                                  businessSeatsTotal: flight.businessSeatsTotal,
                                  economySeatsAvailable: flight.economySeatsAvailable,
                                  businessSeatsAvailable: flight.businessSeatsAvailable,
                                  status: flight.status as "scheduled" | "delayed" | "cancelled",
                                }} 
                                onSubmit={(values) => {
                                  console.log("항공편 수정:", values);
                                  // 여기에 API 호출 로직 추가
                                }}
                              />
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <LucideIcon name="Trash" className="h-3.5 w-3.5" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>항공편 삭제</DialogTitle>
                                <DialogDescription>
                                  {flight.airline} {flight.flightCode} ({flight.date}) 항공편을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex items-center space-x-2 my-4">
                                <Checkbox id="confirm-delete" />
                                <label
                                  htmlFor="confirm-delete"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  이 작업이 되돌릴 수 없음을 이해했습니다.
                                </label>
                              </div>
                              <DialogFooter>
                                <Button variant="outline">취소</Button>
                                <Button variant="destructive">삭제</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
