import { useState, useEffect, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { AuthContext } from "@/context/AuthContext";
import { createReservation, checkDuplicateReservation } from "@/lib/reservationService";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import LucideIcon from "@/components/icons/lucideIcon";
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 결제 방식 (탭에서 직접 하드코딩)

// 신용카드 회사 목록
const cardCompanies = [
  { value: "shinhan", label: "신한카드" },
  { value: "samsung", label: "삼성카드" },
  { value: "hyundai", label: "현대카드" },
  { value: "kb", label: "KB국민카드" },
  { value: "lotte", label: "롯데카드" },
  { value: "bc", label: "비씨카드" },
  { value: "woori", label: "우리카드" },
  { value: "hana", label: "하나카드" },
];

// 할부 개월 옵션
const installmentOptions = [
  { value: "0", label: "일시불" },
  { value: "2", label: "2개월" },
  { value: "3", label: "3개월" },
  { value: "4", label: "4개월" },
  { value: "5", label: "5개월" },
  { value: "6", label: "6개월" },
  { value: "9", label: "9개월" },
  { value: "12", label: "12개월" },
];

// 은행 목록
const bankOptions = [
  { value: "kb", label: "국민은행" },
  { value: "shinhan", label: "신한은행" },
  { value: "woori", label: "우리은행" },
  { value: "hana", label: "하나은행" },
  { value: "nh", label: "농협" },
  { value: "ibk", label: "기업은행" },
  { value: "sc", label: "SC제일은행" },
  { value: "kakao", label: "카카오뱅크" },
  { value: "toss", label: "토스뱅크" },
];

export default function PaymentPage() {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // URL 파라미터에서 값 추출
  const flightId = searchParams.get("flightId");
  const seatType = searchParams.get("seatType");
  const price = searchParams.get("price");
  const passengerCount = searchParams.get("passengers") || "1";
  
  // 추가 파라미터 추출
  const flightCode = searchParams.get("flightCode") || "";
  const airline = searchParams.get("airline");
  const departureAirport = searchParams.get("departureAirport") || "";
  const arrivalAirport = searchParams.get("arrivalAirport") || "";
  const departureTime = searchParams.get("departureTime") || "";
  const arrivalTime = searchParams.get("arrivalTime");
  const departureDate = searchParams.get("departureDate") || "";
  const departureDateTime = departureDate + " " + departureTime;
  
  // 상태 관리
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardCompany, setCardCompany] = useState("");
  const [cardNumber, setCardNumber] = useState(["", "", "", ""]);
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [installment, setInstallment] = useState("0");
  const [bankCode, setBankCode] = useState("");  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flight, setFlight] = useState<any>(null);
  const [alreadyBooked, setAlreadyBooked] = useState(false);
    // 항공편 정보 세팅
  useEffect(() => {
    if (!flightId || !departureAirport || !arrivalAirport) return;
    
    async function loadAirportData() {
      // 항공편 데이터 생성
      const flightData = {
        id: flightId,
        flightCode: flightCode || "",
        airline: airline || "",
        departureAirport: departureAirport || "",
        departureCity: "",
        arrivalAirport: arrivalAirport || "",
        arrivalCity: "",
        departureTime: departureTime || "",
        arrivalTime: arrivalTime || "",
        duration: "",
        date: departureDate || "",
        price: Number(price || 0),
      };
      
      try {
        // 공항 정보 로드 (가능하면)
        const { getAirportByCode } = await import("@/lib/airportService");
        
        // 출발 공항 정보 로드
        try {
          const depAirportInfo = await getAirportByCode(departureAirport);
          flightData.departureCity = depAirportInfo.name;
        } catch (err) {
          console.error(`출발 공항 정보 로드 실패: ${departureAirport}`, err);
        }
        
        // 도착 공항 정보 로드
        try {
          const arrAirportInfo = await getAirportByCode(arrivalAirport);
          flightData.arrivalCity = arrAirportInfo.name;
        } catch (err) {
          console.error(`도착 공항 정보 로드 실패: ${arrivalAirport}`, err);
        }
        
        setFlight(flightData);
      } catch (err) {
        console.error("항공편 정보 로드 실패:", err);
        setFlight({
          id: flightId,
          flightCode: flightCode || "",
          airline: airline || "",
          departureAirport: departureAirport || "",
          arrivalAirport: arrivalAirport || "",
          departureTime: departureTime || "",
          arrivalTime: arrivalTime || "",
          date: departureDate || "",
          price: Number(price || 0),
        });
      }
    }
    
    loadAirportData();
  }, [flightId, flightCode, airline, departureAirport, arrivalAirport, departureTime, arrivalTime, departureDate, price]);
  
  // 중복 예약 확인
  useEffect(() => {
    const checkBookingStatus = async () => {
      if (!user || !user.cno || !flightCode || !departureDateTime) return;
      
      try {
        // 사용자가 이미 해당 항공편을 예약했는지 확인
        const isDuplicate = await checkDuplicateReservation(user.cno, flightCode, departureDateTime);
        
        if (isDuplicate) {
          console.log('이미 예약된 항공편:', flightCode, departureDateTime);
          setAlreadyBooked(true);
          setError('이미 예약하신 항공편입니다. 동일한 항공편을 중복 예약할 수 없습니다.');
        }
      } catch (err) {
        console.error('예약 상태 확인 중 오류:', err);
      }
    };
    
    checkBookingStatus();
  }, [user, flightCode, departureDateTime]);
  
  // 카드 번호 입력 처리
  const handleCardNumberChange = (index: number, value: string) => {
    const newCardNumber = [...cardNumber];
    // 숫자만 입력 가능
    newCardNumber[index] = value.replace(/\D/g, '').slice(0, 4);
    setCardNumber(newCardNumber);
    
    // 자동으로 다음 입력란으로 포커스 이동
    if (value.length === 4 && index < 3) {
      const nextInput = document.getElementById(`card-number-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };
  
  // 카드 유효기간 입력 처리
  const handleExpiryChange = (value: string) => {
    // 숫자만 입력 가능
    const newValue = value.replace(/\D/g, '');
    
    if (newValue.length <= 4) {
      const month = newValue.slice(0, 2);
      const year = newValue.slice(2, 4);
      
      // MM/YY 형식으로 표시
      if (newValue.length > 2) {
        setCardExpiry(`${month}/${year}`);
      } else {
        setCardExpiry(newValue);
      }
    }
  };
  // 결제 처리
  const handlePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 사용자 인증 정보 확인
      if (!user || !user.cno) {
        throw new Error("로그인이 필요합니다.");
      }

      console.log("결제 처리 시작");
      console.log(`flightCode: ${flightCode}, departureDateTime: ${departureDateTime}, seatType: ${seatType}, price: ${price}, passengerCount: ${passengerCount}`);

      // 필수 파라미터 확인
      if (!flightCode || !departureDateTime || !seatType || !price) {
        throw new Error("항공편 정보가 올바르지 않습니다.");
      }
      
      // 결제 금액
      const paymentAmount = Number(price) * Number(passengerCount);
      
      // 항공권 예약 API 호출
      const reservationData = {
        flightNo: flightCode,
        departureDateTime: departureDateTime,
        seatClass: seatType.charAt(0).toUpperCase() + seatType.slice(1).toLowerCase(),
        payment: paymentAmount,
        cno: user.cno
      };
      
      console.log("예약 데이터:", reservationData);
      
      // 백엔드 API 호출
      await createReservation(reservationData);
      
      setSuccess(true);
      
      // 3초 후 마이페이지로 이동
      setTimeout(() => {
        navigate('/user');
      }, 3000);
      
    } catch (err: any) {
      console.error("결제 오류:", err);
      setError(err.message || "결제 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };
    // 취소 처리
  const handleCancel = () => {
    if (confirm("결제를 취소하시겠습니까?")) {
      // 검색 관련 파라미터만 유지하여 flights 페이지로 돌아가기
      const searchFlightsParams = new URLSearchParams();
      
      // 필요한 검색 파라미터만 복사
      if (departureAirport) searchFlightsParams.set("departureAirport", departureAirport);
      if (arrivalAirport) searchFlightsParams.set("arrivalAirport", arrivalAirport);
      if (departureDate) searchFlightsParams.set("departureDate", departureDate);
      if (passengerCount) searchFlightsParams.set("passengers", passengerCount);
      
      navigate(`/flights?${searchFlightsParams.toString()}`);
    }
  };
  
  // 총 결제 금액 계산
  const totalPrice = price ? Number(price) * Number(passengerCount) : 0;
  
  if (!flight) {
    return <div className="container mx-auto py-8 px-4">로딩 중...</div>;
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center">
        <LucideIcon name="WalletCards" className="h-6 w-6 mr-2 text-primary" />
        항공권 결제
      </h1>
      
      <div className="xl:flex sm:flex-1 justify-center gap-6">
        {/* 좌측: 항공편 정보 */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideIcon name="Plane" className="h-5 w-5 text-primary" />
                항공편 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold">{flight.airline}</span>
                    <span className="text-sm text-muted-foreground">{flight.flightCode}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-center">
                      <div className="text-lg font-bold">{flight.departureTime}</div>
                      <div className="text-sm text-muted-foreground">
                        {flight.departureCity ? (
                          <>
                            {flight.departureCity} ({flight.departureAirport})
                          </>
                        ) : (
                          flight.departureAirport
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 mx-2 relative">
                      <div className="border-t border-dashed border-muted-foreground"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-1 text-xs text-muted-foreground">
                        직항
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold">{flight.arrivalTime}</div>
                      <div className="text-sm text-muted-foreground">
                        {flight.arrivalCity ? (
                          <>
                            {flight.arrivalCity} ({flight.arrivalAirport})
                          </>
                        ) : (
                          flight.arrivalAirport
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center font-bold text-base mb-4 flex items-center justify-center gap-2">
                    <LucideIcon name="Calendar" className="h-4 w-4 text-primary" />
                    {flight.date ? (
                      format(new Date(flight.date), 'yyyy년 MM월 dd일', { locale: ko })
                    ) : (
                      "날짜 정보 없음"
                    )} / 
                    <LucideIcon name={seatType === 'business' ? 'Star' : 'Armchair'} className="h-4 w-4 text-primary" />
                    {seatType === 'business' ? '비즈니스석' : '이코노미석'}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <LucideIcon name="Tag" className="h-3 w-3" />
                      기본 요금
                    </span>
                    <span>{Number(price).toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1">
                      <LucideIcon name="Users" className="h-3 w-3" />
                      승객 수
                    </span>
                    <span>{passengerCount}명</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold">
                    <span className="flex items-center gap-1">
                      <LucideIcon name="Wallet" className="h-4 w-4 text-primary" />
                      총 결제 금액
                    </span>
                    <span>{totalPrice.toLocaleString()}원</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* 우측: 결제 정보 */}
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LucideIcon name="CreditCard" className="h-5 w-5 text-primary" />
                결제 정보
              </CardTitle>
            </CardHeader>
            <CardContent>              {success ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <LucideIcon name="Check" className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">결제가 완료되었습니다</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    예약 확인 이메일이 {user?.email}로 발송되었습니다.
                  </p>
                  <div className="mb-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span>항공편:</span>
                      <span className="font-medium">{flight.airline} {flight.flightCode}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>구간:</span>
                      <span className="font-medium">{flight.departureAirport} → {flight.arrivalAirport}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>좌석:</span>
                      <span className="font-medium">{seatType === 'business' ? '비즈니스석' : '이코노미석'} {passengerCount}석</span>
                    </div>
                    <div className="flex justify-between">
                      <span>금액:</span>
                      <span className="font-medium">{totalPrice.toLocaleString()}원</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    예약 정보 및 결제 내역은 이메일로 발송됩니다.
                  </p>
                  <div className="text-sm text-muted-foreground">
                    잠시 후 메인 페이지로 이동합니다...
                  </div>
                </div>
              ) : (
                <>
                  {error && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertTitle>결제 오류</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Tabs
                    defaultValue="card"
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                    className="w-full"
                  >
                    <TabsList className="grid grid-cols-3 mb-6">
                      <TabsTrigger value="card" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        신용/체크카드
                      </TabsTrigger>
                      <TabsTrigger value="vbank" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        무통장입금
                      </TabsTrigger>
                      <TabsTrigger value="trans" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        계좌이체
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="card" className="space-y-4">
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="card-company">카드사 선택</Label>                          <Select value={cardCompany} onValueChange={setCardCompany} disabled>
                            <SelectTrigger id="card-company">
                              <SelectValue placeholder="국민은행" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {cardCompanies.map((company) => (
                                  <SelectItem key={company.value} value={company.value}>
                                    {company.label}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="card-number-0">카드 번호</Label>
                          <div className="grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map((index) => (
                              <Input
                                key={index}
                                id={`card-number-${index}`}
                                inputMode="numeric"
                                maxLength={4}
                                value={index === 0 ? "1234" : index === 1 ? "5678" : index === 2 ? "9012" : "3456"}
                                disabled
                                onChange={(e) => handleCardNumberChange(index, e.target.value)}
                                className="text-center"
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="card-expiry">유효기간 (MM/YY)</Label>
                            <Input
                              id="card-expiry"
                              value="12/25"
                              onChange={(e) => handleExpiryChange(e.target.value)}
                              placeholder="MM/YY"
                              maxLength={5}
                              disabled
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="card-cvc">CVC</Label>
                            <Input
                              id="card-cvc"
                              value="123"
                              onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              inputMode="numeric"
                              maxLength={3}
                              placeholder="카드 뒷면 3자리"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="vbank" className="space-y-4">
                      Not Implemented
                    </TabsContent>
                    
                    <TabsContent value="trans" className="space-y-4">
                      Not Implemented
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex flex-col sm:flex-row w-full gap-2">
                {!success && (
                  <>                    <Button
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <LucideIcon name="X" className="h-4 w-4 mr-1" />
                      취소
                    </Button>                    <Button
                      className="w-full sm:w-auto"
                      onClick={handlePayment}
                      disabled={loading || alreadyBooked}
                      title={alreadyBooked ? "이미 예약된 항공편입니다" : ""}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <span className="mr-2">처리 중...</span>
                          <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></span>
                        </span>
                      ) : (                        <span className="flex items-center">
                          <LucideIcon name="CreditCard" className="mr-2 h-4 w-4" />
                          {totalPrice.toLocaleString()}원 결제하기
                        </span>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
