import { useState, useEffect, useContext } from "react";
import { format, subMonths, subYears, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import { AuthContext } from "@/context/AuthContext";
import { authService } from "@/lib/authService";
import { getFlightDetail } from "@/lib/flightService";
import { 
  getUserReservations, 
  getUserCancellations, 
  createCancellation, 
  calculatePenalty 
} from "@/lib/reservationService";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import LucideIcon from "@/components/icons/lucideIcon";
import { parseISODate } from "@/lib/utils";

// 사용자 정보 인터페이스
interface UserInfo {
  cno: string;
  name: string;
  email: string;
  passportNumber?: string;
}

export default function UserPage() {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookings, setBookings] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [cancellationDialog, setCancellationDialog] = useState(false);
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancellationInfo, setCancellationInfo] = useState<{
    penalty: number;
    refundAmount: number;
  }>({ penalty: 0, refundAmount: 0 });
  const [processingCancellation, setProcessingCancellation] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    passportNumber: ''
  });  
  // 기간 필터 상태 추가
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all", "1m", "3m", "6m", "1y", "custom"
  const [customDateRange, setCustomDateRange] = useState<{
    fromDate: Date | undefined;
    toDate: Date | undefined;
  }>({
    fromDate: undefined,
    toDate: undefined
  });
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  // 전체 항목 목록 (예약 + 환불)
  const [allItems, setAllItems] = useState<any[]>([]);
  
  // 선택된 날짜 필터에 따라 fromDate 문자열을 반환
  const getFromDateString = (filter: string): string | undefined => {
    const today = new Date();
    let dateFrom;
    
    switch (filter) {
      case "1m": // 1개월 전
        dateFrom = subMonths(today, 1);
        break;
      case "3m": // 3개월 전
        dateFrom = subMonths(today, 3);
        break;
      case "6m": // 6개월 전
        dateFrom = subMonths(today, 6);
        break;
      case "1y": // 1년 전
        dateFrom = subYears(today, 1);
        break;
      case "custom": // 사용자 지정 기간
        return customDateRange.fromDate ? format(customDateRange.fromDate, 'yyyy-MM-dd') : undefined;
      default: // 전체 (필터 없음)
        return undefined;
    }
    
    return dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined;
  };
  
  // 선택된 날짜 필터에 따라 toDate 문자열을 반환
  const getToDateString = (filter: string): string | undefined => {
    // 사용자 지정 기간인 경우만 종료 날짜 사용
    if (filter === "custom" && customDateRange.toDate) {
      return format(customDateRange.toDate, 'yyyy-MM-dd');
    }
    return undefined;
  };

  // 사용자 프로필 로드 및 예약/환불 내역 조회
  useEffect(() => {
    // 프로필 정보 로드
    const loadUserProfile = async () => {
      try {
        const profile = await authService.getProfile();
        setUserInfo(profile);
        setProfileForm({
          name: profile.name || '',
          passportNumber: profile.passportNumber || ''
        });
      } catch (err: any) {
        console.error("프로필 로드 중 오류:", err);
        // 오류 처리는 하되, 다른 데이터 로딩은 계속함
      }
    };
    
    loadUserProfile();
    fetchUserData();
  }, [user]);
    // 데이터 필터링 및 로드 함수를 별도로 분리
  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user || !user.cno) {
        throw new Error("로그인이 필요합니다.");
      }
      
      const fromDate = getFromDateString(dateFilter);
      const toDate = getToDateString(dateFilter);
      
      // 예약 내역 조회
      const reservations = await getUserReservations(user.cno, fromDate, toDate);
      const formattedReservations = await Promise.all(reservations.map(async reservation => {
        // 항공편 상세 정보 조회
        const flightDetail = await getFlightDetail(reservation.flightNo, reservation.departureDateTime);

        let duration = "";
        if (flightDetail) {
          const departureTime = parseISODate(reservation.departureDateTime);
          const arrivalTime = parseISODate(flightDetail.arrivalDateTime);

          const durationMinutes = Math.floor((arrivalTime.getTime() - departureTime.getTime()) / 60000);
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          duration = `${hours}시간 ${minutes}분`;
        }
        
        return {
          id: `${reservation.flightNo}-${reservation.departureDateTime}-${reservation.cno}`,
          flightId: reservation.flightNo,
          flightCode: reservation.flightNo,
          airline: getAirlineByFlightCode(reservation.flightNo),
          departureAirport: getAirportCodeFromFlight(reservation.flightNo, true),
          arrivalAirport: getAirportCodeFromFlight(reservation.flightNo, false),
          departureTime: getTimeFromDateTime(reservation.departureDateTime),
          date: getDateFromDateTime(reservation.departureDateTime),
          seatType: reservation.seatClass === 'Business' ? '비즈니스' : '이코노미',
          price: reservation.payment,
          status: "confirmed",
          bookingDate: getDateFromDateTime(reservation.reserveDateTime),
          passengers: 1,
          departureDateTime: reservation.departureDateTime, // 원본 데이터 저장
          cno: reservation.cno,
          // 항공편 상세 정보 추가
          arrivalTime: flightDetail ? getTimeFromDateTime(flightDetail.arrivalDateTime) : "도착시간",
          rawPrice: flightDetail?.seats?.find(seat => 
            seat.seatClass === reservation.seatClass
          )?.price || reservation.payment,
          duration: duration
        };
      }));
      
      setBookings(formattedReservations);
        // 환불 내역 조회
      const cancellations = await getUserCancellations(user.cno, fromDate, toDate);
      const formattedCancellations = await Promise.all(cancellations.map(async cancellation => {
        // 항공편 상세 정보 조회
        const flightDetail = await getFlightDetail(cancellation.flightNo, cancellation.departureDateTime);

        let duration = "";
        let penalty = 0;
        if (flightDetail) {
          const departureTime = parseISODate(cancellation.departureDateTime);
          const arrivalTime = parseISODate(flightDetail.arrivalDateTime);

          const durationMinutes = Math.floor((arrivalTime.getTime() - departureTime.getTime()) / 60000);
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          duration = `${hours}시간 ${minutes}분`;

          // 위약금 계산
          penalty = flightDetail?.seats?.find(seat => 
            seat.seatClass === cancellation.seatClass
          )?.price || 0;
          penalty = Math.max(0, penalty - cancellation.refund);
        }
        
        
        return {
          id: `${cancellation.flightNo}-${cancellation.departureDateTime}-${cancellation.cno}`,
          bookingId: `R-${cancellation.flightNo}`,
          flightId: cancellation.flightNo,
          flightCode: cancellation.flightNo,
          airline: getAirlineByFlightCode(cancellation.flightNo),
          departureAirport: getAirportCodeFromFlight(cancellation.flightNo, true),
          arrivalAirport: getAirportCodeFromFlight(cancellation.flightNo, false),
          departureTime: getTimeFromDateTime(cancellation.departureDateTime),
          date: getDateFromDateTime(cancellation.departureDateTime),
          seatType: cancellation.seatClass === 'Business' ? '비즈니스' : '이코노미',
          price: cancellation.refund, // 환불 금액
          status: "refunded",
          refundDate: getDateFromDateTime(cancellation.cancelDateTime),
          refundAmount: cancellation.refund,
          passengers: 1,
          // 항공편 상세 정보 추가
          arrivalTime: flightDetail ? getTimeFromDateTime(flightDetail.arrivalDateTime) : "도착시간",
          rawPrice: flightDetail?.seats?.find(seat => 
            seat.seatClass === cancellation.seatClass
          )?.price || cancellation.refund,
          duration: duration,
          penalty: penalty,
        };
      }));
        setRefunds(formattedCancellations);
      
      // 전체 항목 목록 생성 (예약 + 환불)
      const allItemsList = [
        ...formattedReservations.map(item => ({ ...item, itemType: 'booking' })),
        ...formattedCancellations.map(item => ({ ...item, itemType: 'refund' }))
      ];      // 날짜순으로 정렬 (최신순)
      allItemsList.sort((a, b) => {
        // date 속성은 모든 항목에 있으므로 이것으로 정렬
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      
      setAllItems(allItemsList);
    } catch (err: any) {
      console.error("사용자 데이터 조회 오류:", err);
      setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
  
  // 날짜 필터 변경시 데이터 다시 로드
  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [dateFilter]);
  
  // 항공사 코드로 항공사 이름 반환 (임시 구현)
  const getAirlineByFlightCode = (flightCode: string) => {
    if (flightCode.startsWith('KE')) return '대한항공';
    if (flightCode.startsWith('OZ')) return '아시아나항공';
    if (flightCode.startsWith('7C')) return '제주항공';
    if (flightCode.startsWith('LJ')) return '진에어';
    if (flightCode.startsWith('TW')) return '티웨이항공';
    return flightCode.substring(0, 2) + '항공';
  };  // 항공편 코드로부터 공항 코드 추출 (flightService 사용)
  const getAirportCodeFromFlight = (flightCode: string, isDeparture: boolean): string => {
    // 기본값 설정 (캐시에 없거나 API 호출 실패 시 반환)
    const defaultAirport = isDeparture ? 'ICN' : 'NRT';
    
    // 로컬 캐시 초기화
    const flightCache = window.flightCache || {};
    
    // 비행 정보가 이미 저장되어 있는 경우
    if (flightCode in flightCache) {
      const cachedData = flightCache[flightCode];
      return isDeparture ? cachedData.departureAirport : cachedData.arrivalAirport;
    }
    
    // 캐시에 없는 경우 백그라운드에서 데이터 로드
    // 비동기 함수를 동기 함수처럼 사용하기 위한 패턴
    setTimeout(async () => {
      try {
        // API 호출
        const flightData = await getFlightDetail(flightCode, "");
        
        if (flightData) {
          // 캐시 객체 없으면 초기화
          if (!window.flightCache) {
            window.flightCache = {};
          }
          
          // 캐시에 저장
          window.flightCache[flightCode] = {
            departureAirport: flightData.departureAirport || defaultAirport,
            arrivalAirport: flightData.arrivalAirport || (isDeparture ? 'NRT' : 'ICN')
          };
          
          // 화면 갱신을 위해 상태 업데이트 트리거
          fetchUserData();
        }
      } catch (error) {
        console.error('공항 코드 추출 중 오류 발생:', error);
      }
    }, 0);
    
    // 백그라운드 로드가 완료될 때까지 기본값 반환
    return defaultAirport;
  };
  
  // 날짜시간 문자열에서 시간 부분만 추출 (24시간제)
  const getTimeFromDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      // 24시간제로 시간을 표시하기 위해 hour12: false 옵션 추가
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false // 24시간제 표시
      });
    } catch (e) {
      return "00:00";
    }
  };
  
  // 날짜시간 문자열에서 날짜 부분만 추출
  const getDateFromDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr);
      return format(date, 'yyyy-MM-dd', { locale: ko });
    } catch (e) {
      return "날짜 정보 없음";
    }
  };
  
  // 환불 요청 처리
  const handleRefundRequest = (booking: any) => {
    setSelectedBooking(booking);
    
    // 출발일 기준 위약금 계산
    const departureDate = new Date(booking.departureDateTime);
    const penalty = calculatePenalty(departureDate);
    const originalPrice = Number(booking.price);
    
    // 환불 불가 케이스 (-1)
    if (penalty === -1) {
      setCancellationInfo({
        penalty: originalPrice, // 전액 위약금
        refundAmount: 0 // 환불 불가
      });
    } else {
      // 환불 금액 = 원금 - 위약금 (음수가 되지 않도록)
      const refundAmount = Math.max(0, originalPrice - penalty);
      setCancellationInfo({
        penalty,
        refundAmount
      });
    }
    
    setCancellationDialog(true);
  };
    // 환불 진행
  const processCancellation = async () => {
    if (!selectedBooking) return;
    
    setProcessingCancellation(true);
    
    try {
      const cancellationData = {
        flightNo: selectedBooking.flightCode,
        departureDateTime: selectedBooking.departureDateTime,
        seatClass: selectedBooking.seatType === '비즈니스' ? 'Business' : 'Economy',
        refund: cancellationInfo.refundAmount,
        cno: selectedBooking.cno
      };
      
      await createCancellation(cancellationData);
      
      // 성공 처리
      toast.success("환불 처리 완료", {
        description: `${cancellationInfo.refundAmount.toLocaleString()}원이 환불 처리되었습니다.`,
      });
      
      // 예약 목록에서 제거하고 환불 목록에 추가
      setBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
      
      const newRefund = {
        ...selectedBooking,
        status: "refunded",
        refundDate: format(new Date(), 'yyyy-MM-dd'),
        refundAmount: cancellationInfo.refundAmount
      };
      
      setRefunds(prev => [...prev, newRefund]);
      setActiveTab("refunds"); // 환불 탭으로 전환
      
      // 환불 처리 후 모달 닫기 및 상태 초기화
      setCancellationDialog(false);
      setProcessingCancellation(false);
      
    } catch (err: any) {
      console.error("환불 처리 오류:", err);
      toast.error("환불 처리 실패", {
        description: err.message || "환불 처리 중 오류가 발생했습니다.",
      });
      setProcessingCancellation(false);
      setCancellationDialog(false);
    }
  };

  // 프로필 정보 수정 핸들러
  const handleProfileUpdate = async () => {
    if (!userInfo?.cno) {
      toast.error("오류 발생", { description: "사용자 정보를 찾을 수 없습니다." });
      return;
    }
    
    setSavingProfile(true);
    
    try {
      // 빈 필드는 제외하고 업데이트 요청
      const updateData: { name?: string; passportNumber?: string } = {};
      if (profileForm.name) updateData.name = profileForm.name;
      if (profileForm.passportNumber) updateData.passportNumber = profileForm.passportNumber;
      
      const updatedProfile = await authService.updateUserProfile(userInfo.cno, updateData);
      
      setUserInfo(updatedProfile);
      setEditProfileDialog(false);
      
      toast.success("프로필 수정 완료", {
        description: "사용자 정보가 성공적으로 업데이트되었습니다.",
      });
    } catch (err: any) {
      console.error("프로필 업데이트 오류:", err);
      toast.error("프로필 수정 실패", {
        description: err.message || "정보 업데이트 중 오류가 발생했습니다.",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* 사용자 정보 카드 */}      <Card className="mb-8">
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
                <div className="font-medium">{userInfo?.name || '로딩 중...'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">이메일</div>
                <div className="font-medium">{userInfo?.email || '로딩 중...'}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">사용자 ID</div>
                <div className="font-medium">{userInfo?.cno || '로딩 중...'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">여권 번호</div>
                <div className="font-medium">{userInfo?.passportNumber || '미등록'}</div>
              </div>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditProfileDialog(true)}
                  className="w-full"
                >
                  <LucideIcon name="Pencil" className="h-4 w-4 mr-2" />
                  프로필 수정
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>      {/* 예약/환불 탭 */}
      <Tabs defaultValue="bookings" onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <LucideIcon name="LayoutList" className="h-4 w-4" /> 전체 내역
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1">
              <LucideIcon name="Plane" className="h-4 w-4" /> 예약 목록
            </TabsTrigger>
            <TabsTrigger value="refunds" className="flex items-center gap-1">
              <LucideIcon name="RefreshCcw" className="h-4 w-4" /> 환불 목록
            </TabsTrigger>
          </TabsList>
            {/* 기간 필터 추가 */}
          <div className="flex gap-2 items-center">
            <div className="text-sm text-muted-foreground mr-1">조회 기간:</div>
            <div className="flex bg-muted rounded-md">
              <Button
                variant={dateFilter === "all" ? "secondary" : "ghost"} 
                size="sm"
                className="text-xs h-7 px-2 rounded-md"
                onClick={() => setDateFilter("all")}
              >
                전체
              </Button>
              <Button 
                variant={dateFilter === "1m" ? "secondary" : "ghost"} 
                size="sm"
                className="text-xs h-7 px-2 rounded-md"
                onClick={() => setDateFilter("1m")}
              >
                1개월
              </Button>
              <Button 
                variant={dateFilter === "3m" ? "secondary" : "ghost"} 
                size="sm"
                className="text-xs h-7 px-2 rounded-md"
                onClick={() => setDateFilter("3m")}
              >
                3개월
              </Button>
              <Button 
                variant={dateFilter === "6m" ? "secondary" : "ghost"} 
                size="sm"
                className="text-xs h-7 px-2 rounded-md"
                onClick={() => setDateFilter("6m")}
              >
                6개월
              </Button>
              <Button 
                variant={dateFilter === "1y" ? "secondary" : "ghost"} 
                size="sm"
                className="text-xs h-7 px-2 rounded-md"
                onClick={() => setDateFilter("1y")}
              >
                1년
              </Button>
              
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button 
                    variant={dateFilter === "custom" ? "secondary" : "ghost"} 
                    size="sm"
                    className="text-xs h-7 px-2 rounded-md"
                    onClick={() => {
                      if (dateFilter !== "custom") {
                        setDateFilter("custom");
                      }
                      setShowDatePicker(true);
                    }}
                  >
                    <LucideIcon name="Calendar" className="h-3 w-3 mr-1" />
                    {dateFilter === "custom" && customDateRange.fromDate ? 
                      `${format(customDateRange.fromDate, 'yy.MM.dd')}${customDateRange.toDate ? ` - ${format(customDateRange.toDate, 'yy.MM.dd')}` : ''}` : 
                      "날짜 지정"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <div className="border-b border-muted-foreground/10 p-3">
                    <h4 className="text-sm font-medium">날짜 범위 지정</h4>
                    <p className="text-xs text-muted-foreground">조회할 기간의 시작일과 종료일을 선택하세요</p>
                  </div>
                  <div className="p-3 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs mb-2">시작 날짜:</p>
                        <Calendar
                          mode="single"
                          selected={customDateRange.fromDate}
                          onSelect={(date) => setCustomDateRange(prev => ({ ...prev, fromDate: date || undefined }))}
                          initialFocus
                          disabled={(date) => customDateRange.toDate ? date > customDateRange.toDate : false}
                          className="border rounded-md p-2"
                        />
                      </div>
                      <div>
                        <p className="text-xs mb-2">종료 날짜:</p>
                        <Calendar
                          mode="single"
                          selected={customDateRange.toDate}
                          onSelect={(date) => setCustomDateRange(prev => ({ ...prev, toDate: date || undefined }))}
                          disabled={(date) => customDateRange.fromDate ? date < customDateRange.fromDate : false}
                          className="border rounded-md p-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <Button 
                        variant="outline" 
                        className="text-xs" 
                        onClick={() => {
                          setCustomDateRange({ fromDate: undefined, toDate: undefined });
                          setDateFilter("all");
                          setShowDatePicker(false);
                        }}
                        size="sm"
                      >
                        초기화
                      </Button>
                      <Button 
                        className="text-xs" 
                        onClick={() => {
                          setShowDatePicker(false);
                          fetchUserData();
                        }}
                        disabled={!customDateRange.fromDate}
                        size="sm"
                      >
                        적용
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
            <div className="text-sm text-muted-foreground flex items-center">
            <LucideIcon name="Search" className="h-3 w-3 mr-1" />
            총 {activeTab === "all" ? allItems.length : activeTab === "bookings" ? bookings.length : refunds.length}개의 항목이 있습니다.
          </div>
        </div>
        
        {/* 전체 내역 */}
        <TabsContent value="all" className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mb-2"></div>
              <p className="text-sm text-muted-foreground">{dateFilter !== "all" ? "선택한 기간의 전체 내역을 불러오는 중..." : "전체 내역을 불러오는 중..."}</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <LucideIcon name="CircleAlert" className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p>{error}</p>
            </div>
          ) : allItems.length === 0 ? (
            <div className="p-6 text-center">
              <LucideIcon name="Inbox" className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p>{dateFilter !== "all" 
                ? `선택한 기간 내에 항공권 예약/환불 내역이 없습니다.` 
                : "항공권 예약/환불 내역이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allItems.map((item) => (
                <Card key={item.id} className={`overflow-hidden ${item.itemType === 'refund' ? 'border-l-4 border-l-orange-300' : ''}`}>
                  <div className="grid sm:grid-cols-1 lg:grid-cols-10 gap-0">
                    {/* 항공편 정보 - 좌측 */}
                    <div className="lg:col-span-4 p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <LucideIcon name="Plane" className="h-4 w-4 text-primary" />
                          <span className="font-bold">{item.airline}</span>
                          <span className="text-sm text-muted-foreground">{item.flightCode}</span>
                          {item.itemType === 'refund' && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                              환불됨
                            </span>
                          )}
                        </div>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {item.date}
                        </span>
                      </div>
                        
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-center">
                          <div className="text-xl font-bold">{item.departureTime}</div>
                          <div className="text-sm text-muted-foreground">{item.departureAirport}</div>
                        </div>
                        
                        <div className="flex-1 mx-4 relative">
                          <div className="border-t border-dashed border-muted-foreground"></div>
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                            {item.duration}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-xl font-bold">{item.arrivalTime}</div>
                          <div className="text-sm text-muted-foreground">{item.arrivalAirport}</div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mt-3">
                        {item.itemType === 'booking' ? (
                          <>예약번호: {item.id} | 예약일: {item.bookingDate}</>
                        ) : (
                          <>환불번호: {item.id} | 환불일: {item.refundDate}</>
                        )}
                      </div>
                    </div>
                    
                    {/* 예약/환불 정보 - 우측 */}
                    <div className="lg:col-span-6 grid grid-cols-1 border-t lg:border-t-0 lg:border-l border-border">
                      <div className="p-6 flex flex-col h-full">
                        <div className="flex justify-between mb-4">
                          <div>
                            <div className="text-sm font-medium mb-1">
                              {item.itemType === 'booking' ? '결제 금액' : '환불 금액'}
                            </div>
                            <div className="font-bold text-xl">
                              {item.itemType === 'booking' ? 
                                (item.price * item.passengers).toLocaleString() : 
                                item.refundAmount.toLocaleString()}원
                            </div>
                            {item.itemType === 'refund' && (
                              <div className="text-xs text-muted-foreground">
                                (위약금: {(item.penalty).toLocaleString()}원)
                              </div>
                            )}
                          </div>
                          
                          {item.itemType === 'booking' && (
                            <Button 
                              variant="destructive"
                              onClick={() => handleRefundRequest(item)}
                            >
                              환불 요청
                            </Button>
                          )}
                          {item.itemType === 'refund' && (
                            <div className="px-4 py-2 rounded-md bg-green-100 text-green-700">
                              환불 완료
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground">좌석 유형</div>
                            <div className="font-medium">{item.seatType}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">탑승객</div>
                            <div className="font-medium">{item.passengers}명</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">상태</div>
                            <div className="font-medium">
                              {item.itemType === 'booking' ? "예약 완료" : "환불 완료"}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">1인당 가격</div>
                            <div className="font-medium">{item.price.toLocaleString()}원</div>
                            {item.rawPrice && item.rawPrice !== item.price && (
                              <div className="text-xs text-muted-foreground">
                                원가: {item.rawPrice.toLocaleString()}원
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* 예약 목록 */}
        <TabsContent value="bookings" className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mb-2"></div>
              <p className="text-sm text-muted-foreground">{dateFilter !== "all" ? "선택한 기간의 예약 목록을 불러오는 중..." : "예약 목록을 불러오는 중..."}</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <LucideIcon name="CircleAlert" className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p>{error}</p>
            </div>          ) : bookings.length === 0 ? (
            <div className="p-6 text-center">
              <LucideIcon name="Inbox" className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p>{dateFilter !== "all" 
                ? `선택한 기간(${dateFilter === "1m" ? "1개월" : dateFilter === "3m" ? "3개월" : dateFilter === "6m" ? "6개월" : "1년"}) 내에 예약된 항공권이 없습니다.` 
                : "예약된 항공권이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
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
                            {booking.duration}
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
                          <Button 
                            variant="destructive"
                            onClick={() => handleRefundRequest(booking)}
                          >
                            환불 요청
                          </Button>
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
                          </div>                          <div>
                            <div className="text-muted-foreground">1인당 가격</div>
                            <div className="font-medium">{booking.price.toLocaleString()}원</div>
                            {booking.rawPrice && booking.rawPrice !== booking.price && (
                              <div className="text-xs text-muted-foreground">
                                원가: {booking.rawPrice.toLocaleString()}원
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>        
        {/* 환불 목록 */}
        <TabsContent value="refunds" className="mt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full mb-2"></div>
              <p className="text-sm text-muted-foreground">{dateFilter !== "all" ? "선택한 기간의 환불 목록을 불러오는 중..." : "환불 목록을 불러오는 중..."}</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <LucideIcon name="CircleAlert" className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p>{error}</p>
            </div>          ) : refunds.length === 0 ? (
            <div className="p-6 text-center">
              <LucideIcon name="Inbox" className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p>{dateFilter !== "all" 
                ? `선택한 기간(${dateFilter === "1m" ? "1개월" : dateFilter === "3m" ? "3개월" : dateFilter === "6m" ? "6개월" : "1년"}) 내에 환불 내역이 없습니다.` 
                : "환불 내역이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map((refund) => (
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
                          {refund.duration}
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
                            (위약금: {refund.penalty.toLocaleString()}원)
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
                        </div>                        <div>
                          <div className="text-muted-foreground">1인당 가격</div>
                          <div className="font-medium">{refund.price.toLocaleString()}원</div>
                          {refund.rawPrice && refund.rawPrice !== refund.price && (
                            <div className="text-xs text-muted-foreground">
                              원가: {refund.rawPrice.toLocaleString()}원
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div> )}
        </TabsContent>
      </Tabs>
        {/* 환불 요청 대화상자 */}
      <Dialog open={cancellationDialog} onOpenChange={setCancellationDialog}>
        <DialogContent className="max-w-[400px] p-5">
          <DialogHeader className="pb-2">
            <DialogTitle>항공권 환불 요청</DialogTitle>
            <DialogDescription className="text-xs">
              아래 내용을 확인하시고 환불 진행을 원하시면 '환불 신청' 버튼을 눌러주세요.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-3">
              <div className="border rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <LucideIcon name="Plane" className="h-3 w-3 text-primary" />
                    <span className="font-bold text-sm">{selectedBooking.airline}</span>
                    <span className="text-xs text-muted-foreground">{selectedBooking.flightCode}</span>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{selectedBooking.date}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <div>{selectedBooking.departureAirport} → {selectedBooking.arrivalAirport}</div>
                  <div className="font-medium">{selectedBooking.seatType}</div>
                </div>
              </div>
              
              <div className="space-y-2 pt-1">
                {/* 원래 금액 */}
                <div className="flex justify-between">
                  <div className="text-sm">결제 금액</div>
                  <div className="font-medium">{selectedBooking.price.toLocaleString()}원</div>
                </div>
                
                {/* 위약금 */}
                <div className="flex justify-between">
                  <div className="text-sm text-destructive">위약금</div>
                  <div className="font-medium text-destructive">
                    {cancellationInfo.penalty === -1 
                      ? "전액 위약금" 
                      : `${cancellationInfo.penalty.toLocaleString()}원`}
                  </div>
                </div>
                
                <div className="border-t pt-2 mt-1">
                  <div className="flex justify-between font-bold">
                    <div>환불 금액</div>
                    <div>{cancellationInfo.refundAmount.toLocaleString()}원</div>
                  </div>
                </div>
                
                {cancellationInfo.refundAmount === 0 && (
                  <div className="bg-orange-100 text-orange-800 rounded-md px-2 py-1.5 text-xs mt-2">
                    <LucideIcon name="TriangleAlert" className="h-3 w-3 inline-block mr-1" />
                    당일 취소 또는 위약금이 결제 금액을 초과하여 환불 금액이 없습니다.
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-3">
            <Button
              variant="outline"
              onClick={() => setCancellationDialog(false)}
              disabled={processingCancellation}
              className="h-8 text-sm"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={processCancellation}
              disabled={processingCancellation}
              className="h-8 text-sm"
            >
              {processingCancellation ? (
                <span className="flex items-center">
                  <span className="mr-1">처리 중</span>
                  <span className="animate-spin h-3 w-3 border-t-2 border-b-2 border-primary-foreground rounded-full"></span>
                </span>
              ) : (
                "환불 신청"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 프로필 수정 대화상자 */}
      <Dialog open={editProfileDialog} onOpenChange={setEditProfileDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필 정보 수정</DialogTitle>
            <DialogDescription>
              변경하실 정보를 입력한 후 저장 버튼을 눌러주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input 
                id="name" 
                value={profileForm.name} 
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                placeholder="이름을 입력하세요" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passportNumber">여권 번호</Label>
              <Input 
                id="passportNumber" 
                value={profileForm.passportNumber} 
                onChange={(e) => setProfileForm({...profileForm, passportNumber: e.target.value})}
                placeholder="여권 번호를 입력하세요 (선택사항)" 
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditProfileDialog(false)} 
              disabled={savingProfile}
            >
              취소
            </Button>
            <Button 
              onClick={handleProfileUpdate} 
              disabled={savingProfile}
            >
              {savingProfile ? (
                <span className="flex items-center">
                  <span className="mr-2">저장 중...</span>
                  <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full"></span>
                </span>
              ) : (
                "저장"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  );
}
