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
import LucideIcon from "@/components/icons/lucideIcon";

// 임시 사용자 정보
const temporaryUser = {
  id: "user123",
  name: "홍길동",
  email: "hong@example.com",
  phone: "010-1234-5678",
  passportNumber: "M12345678",
  nationality: "대한민국",
};

// 임시 예약 목록
const temporaryBookings = [
  {
    id: "B001",
    flightId: 1,
    flightCode: "KE123",
    airline: "대한항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "NRT",
    arrivalCity: "도쿄",
    departureTime: "08:30",
    arrivalTime: "11:00",
    date: "2025-05-30",
    seatType: "비즈니스",
    price: 550000,
    status: "confirmed", // confirmed, canceled
    bookingDate: "2025-05-20",
    passengers: 1,
  },
  {
    id: "B002",
    flightId: 3,
    flightCode: "OZ456",
    airline: "아시아나항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "HND",
    arrivalCity: "도쿄",
    departureTime: "13:20",
    arrivalTime: "15:45",
    date: "2025-06-05",
    seatType: "이코노미",
    price: 320000,
    status: "confirmed",
    bookingDate: "2025-05-22",
    passengers: 2,
  },
  {
    id: "B003",
    flightId: 5,
    flightCode: "7C123",
    airline: "제주항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "KIX",
    arrivalCity: "오사카",
    departureTime: "10:30",
    arrivalTime: "12:40",
    date: "2025-06-10",
    seatType: "이코노미",
    price: 280000,
    status: "confirmed",
    bookingDate: "2025-05-23",
    passengers: 1,
  },
];

// 임시 환불 목록
const temporaryRefunds = [
  {
    id: "R001",
    bookingId: "B004",
    flightId: 7,
    flightCode: "KE789",
    airline: "대한항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "BKK",
    arrivalCity: "방콕",
    departureTime: "23:30",
    arrivalTime: "03:20",
    date: "2025-05-25",
    seatType: "이코노미",
    price: 480000,
    status: "refunded", // refunded, processing
    refundDate: "2025-05-21",
    refundAmount: 432000, // 90% 환불
    passengers: 1,
  },
  {
    id: "R002",
    bookingId: "B005",
    flightId: 9,
    flightCode: "TW456",
    airline: "티웨이항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "CTS",
    arrivalCity: "삿포로",
    departureTime: "09:15",
    arrivalTime: "12:00",
    date: "2025-05-27",
    seatType: "이코노미",
    price: 350000,
    status: "processing",
    refundDate: "2025-05-24",
    refundAmount: 280000, // 80% 환불 (처리중)
    passengers: 2,
  },
];

export default function UserPage() {
  const [activeTab, setActiveTab] = useState("bookings");

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* 사용자 정보 카드 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LucideIcon name="User" className="h-5 w-5 text-primary" />
            사용자 정보
          </CardTitle>
          <CardDescription>계정 정보 및 개인 정보를 확인할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">이름</div>
                <div className="font-medium">{temporaryUser.name}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">이메일</div>
                <div className="font-medium">{temporaryUser.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">전화번호</div>
                <div className="font-medium">{temporaryUser.phone}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">사용자 ID</div>
                <div className="font-medium">{temporaryUser.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">여권 번호</div>
                <div className="font-medium">{temporaryUser.passportNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">국적</div>
                <div className="font-medium">{temporaryUser.nationality}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 예약/환불 탭 */}
      <Tabs defaultValue="bookings" onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="bookings" className="flex items-center gap-1">
              <LucideIcon name="Plane" className="h-4 w-4" /> 예약 목록
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-1">
              <LucideIcon name="RefreshCcw" className="h-4 w-4" /> 환불 목록
            </TabsTrigger>
          </TabsList>
          <div className="text-sm text-muted-foreground flex items-center">
            <LucideIcon name="Search" className="h-3 w-3 mr-1" />
            총 {activeTab === "bookings" ? temporaryBookings.length : temporaryRefunds.length}개의 항목이 있습니다.
          </div>
        </div>

        {/* 예약 목록 */}
        <TabsContent value="bookings" className="mt-0">
          <div className="space-y-4">
            {temporaryBookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden">
                <div className="grid sm:grid-cols-1 lg:grid-cols-10 gap-0">
                  {/* 항공편 정보 - 좌측 */}
                  <div className="lg:col-span-4 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <LucideIcon name="Plane" className="h-4 w-4 text-primary" />
                        <span className="font-bold">{booking.airline}</span>
                        <span className="text-sm text-muted-foreground">{booking.flightCode}</span>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {booking.date}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center">
                        <div className="text-xl font-bold">{booking.departureTime}</div>
                        <div className="text-sm text-muted-foreground">{booking.departureAirport}</div>
                      </div>
                      
                      <div className="flex-1 mx-4 relative">
                        <div className="border-t border-dashed border-muted-foreground"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                          {booking.departureCity} → {booking.arrivalCity}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xl font-bold">{booking.arrivalTime}</div>
                        <div className="text-sm text-muted-foreground">{booking.arrivalAirport}</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-3">
                      예약번호: {booking.id} | 예약일: {booking.bookingDate}
                    </div>
                  </div>
                  
                  {/* 예약 정보 및 환불 - 우측 */}
                  <div className="lg:col-span-6 grid grid-cols-1 border-t lg:border-t-0 lg:border-l border-border">
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between mb-4">
                        <div>
                          <div className="text-sm font-medium mb-1">
                            {booking.seatType} {booking.passengers}명
                          </div>
                          <div className="font-bold text-xl">
                            {(booking.price * booking.passengers).toLocaleString()}원
                          </div>
                        </div>
                        <button 
                          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
                          onClick={() => {
                            // 환불 기능은 아직 구현하지 않음
                            console.log("환불 요청:", booking.id);
                          }}
                        >
                          환불 요청
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">좌석 유형</div>
                          <div className="font-medium">{booking.seatType}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">탑승객</div>
                          <div className="font-medium">{booking.passengers}명</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">상태</div>
                          <div className="font-medium">
                            {booking.status === "confirmed" ? "예약 완료" : "취소됨"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">1인당 가격</div>
                          <div className="font-medium">{booking.price.toLocaleString()}원</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 환불 목록 */}
        <TabsContent value="refunds" className="mt-0">
          <div className="space-y-4">
            {temporaryRefunds.map((refund) => (
              <Card key={refund.id} className="overflow-hidden">
                <div className="grid sm:grid-cols-1 lg:grid-cols-10 gap-0">
                  {/* 항공편 정보 - 좌측 */}
                  <div className="lg:col-span-4 p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <LucideIcon name="Plane" className="h-4 w-4 text-primary" />
                        <span className="font-bold">{refund.airline}</span>
                        <span className="text-sm text-muted-foreground">{refund.flightCode}</span>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {refund.date}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-center">
                        <div className="text-xl font-bold">{refund.departureTime}</div>
                        <div className="text-sm text-muted-foreground">{refund.departureAirport}</div>
                      </div>
                      
                      <div className="flex-1 mx-4 relative">
                        <div className="border-t border-dashed border-muted-foreground"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                          {refund.departureCity} → {refund.arrivalCity}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xl font-bold">{refund.arrivalTime}</div>
                        <div className="text-sm text-muted-foreground">{refund.arrivalAirport}</div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-3">
                      환불번호: {refund.id} | 원 예약번호: {refund.bookingId} | 환불신청일: {refund.refundDate}
                    </div>
                  </div>
                  
                  {/* 환불 정보 - 우측 */}
                  <div className="lg:col-span-6 grid grid-cols-1 border-t lg:border-t-0 lg:border-l border-border">
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between mb-4">
                        <div>
                          <div className="text-sm font-medium mb-1">
                            환불 금액
                          </div>
                          <div className="font-bold text-xl">
                            {refund.refundAmount.toLocaleString()}원
                          </div>
                          <div className="text-xs text-muted-foreground">
                            (원금액: {(refund.price * refund.passengers).toLocaleString()}원)
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-md 
                          ${refund.status === "refunded" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-yellow-100 text-yellow-700"}`}>
                          {refund.status === "refunded" ? "환불 완료" : "처리 중"}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">좌석 유형</div>
                          <div className="font-medium">{refund.seatType}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">탑승객</div>
                          <div className="font-medium">{refund.passengers}명</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">상태</div>
                          <div className="font-medium">
                            {refund.status === "refunded" ? "환불 완료" : "처리 중"}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">1인당 가격</div>
                          <div className="font-medium">{refund.price.toLocaleString()}원</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
