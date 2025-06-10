import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Card,
} from "@/components/ui/card";
import { formatDateKST, parseISODate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FlightSearchForm from "@/components/forms/flightSearchForm";
import LucideIcon from "@/components/icons/lucideIcon";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { searchFlights } from "@/lib/flightService";
import type { Flight } from "@/lib/flightService";

// 항공편 UI에 맞게 변환된 데이터 형식
interface UIFlight {
  id: string;
  flightCode: string;
  airline: string;
  departureAirport: string;
  departureCity: string;
  arrivalAirport: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  date: string;
  businessPrice: number;
  economyPrice: number;
  businessSeatsAvailable: number;
  economySeatsAvailable: number;
}

// 정렬 옵션
const sortOptions = [
  { value: "departureDateTime", label: "출발시간 순" },
  { value: "-departureDateTime", label: "출발시간 역순" },
  { value: "airline", label: "항공사 순" },
  { value: "economyPrice", label: "이코노미 가격 순" },
  { value: "-economyPrice", label: "이코노미 가격 역순" },
  { value: "businessPrice", label: "비즈니스 가격 순" },
  { value: "-businessPrice", label: "비즈니스 가격 역순" },
];

export default function FlightsPage() {  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayDates, setDisplayDates] = useState<Date[]>([]);
  const [sortBy, setSortBy] = useState<string>("economyPrice"); // 기본 정렬 기준을 이코노미 가격순으로 변경
  const [flights, setFlights] = useState<UIFlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalFlights, setTotalFlights] = useState(0);
    // URL에서 검색 파라미터 추출
  const departureAirport = searchParams.get("departureAirport") || "";
  const arrivalAirport = searchParams.get("arrivalAirport") || "";
  const departureDateStr = searchParams.get("departureDate") || formatDateKST(new Date(), "YYYY-MM-DD");
  const passengers = Number(searchParams.get("passengers")) || 1;
  
  // sortBy 값이 변경될 때 프론트엔드에서 재정렬
  useEffect(() => {
    if (flights.length > 0) {
      const sortedFlights = sortFlightsByOption(flights, sortBy);
      setFlights(sortedFlights);
    }
  }, [sortBy]);

  // 날짜 설정
  useEffect(() => {
    if (departureDateStr) {
      try {
        console.log(`prev: ${departureDateStr} -> `, parseISODate(departureDateStr));
        setSelectedDate(parseISODate(departureDateStr));
      } catch (error) {
        console.error("Invalid date format:", error);
        setSelectedDate(new Date());
      }
    }
  }, [departureDateStr]);
    // 항공편 데이터 로드
  useEffect(() => {
    const loadFlights = async () => {
      if (!departureAirport || !arrivalAirport) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // 공항 정보 먼저 로드 (캐싱)
        const newCache = { ...airportCache };
        if (!airportCache[departureAirport]) {
          try {
            const { getAirportByCode } = await import("@/lib/airportService");
            const airportInfo = await getAirportByCode(departureAirport);
            newCache[departureAirport] = `${airportInfo.name} (${airportInfo.code})`;
          } catch (err) {
            console.error(`공항 정보 로드 실패 (${departureAirport}):`, err);
          }
        }
        if (!airportCache[arrivalAirport]) {
          try {
            const { getAirportByCode } = await import("@/lib/airportService");
            const airportInfo = await getAirportByCode(arrivalAirport);
            newCache[arrivalAirport] = `${airportInfo.name} (${airportInfo.code})`;
          } catch (err) {
            console.error(`공항 정보 로드 실패 (${arrivalAirport}):`, err);
          }
        }
        if (Object.keys(newCache).length > Object.keys(airportCache).length) {
          setAirportCache(newCache);
        }
          // 항공편 검색 - 백엔드에서는 항상 departureDateTime 기준으로 요청
        const response = await searchFlights({
          departureAirport,
          arrivalAirport,
          departureDate: departureDateStr,
          sortBy: "departureDateTime" // 항상 출발 시간순으로 요청
        });
        
        setTotalFlights(response.total);
          // API 결과를 UI 형식으로 변환
        const uiFlights = response.airplanes.map((flight: Flight): UIFlight => {
          const departureDate = parseISODate(flight.departureDateTime);
          const arrivalDate = parseISODate(flight.arrivalDateTime);
          
          // 비행 시간 계산 (분 단위)
          const durationMinutes = Math.floor((arrivalDate.getTime() - departureDate.getTime()) / (1000 * 60));
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          
          // 좌석 정보 처리
          let businessPrice = 0;
          let economyPrice = 0;
          let businessSeatsAvailable = 0;
          let economySeatsAvailable = 0;
          
          // 좌석 정보가 있을 경우 클래스별로 처리
          if (flight.seats && flight.seats.length > 0) {
            flight.seats.forEach(seat => {
              if (seat.seatClass.toLowerCase() === 'business') {
                businessPrice = seat.price;
                businessSeatsAvailable = seat.no_of_seats;
              } else if (seat.seatClass.toLowerCase() === 'economy') {
                economyPrice = seat.price;
                economySeatsAvailable = seat.no_of_seats;
              }
            });
          } else {
            // 좌석 정보가 없을 경우 기본값 설정 (이전 코드의 랜덤 값 사용)
            console.warn(`항공편 ${flight.flightNo}의 좌석 정보가 없습니다. 기본값을 사용합니다.`);
            businessPrice = Math.floor(Math.random() * 300000) + 300000;
            economyPrice = Math.floor(Math.random() * 100000) + 150000;
            businessSeatsAvailable = Math.floor(Math.random() * 15) + 5;
            economySeatsAvailable = Math.floor(Math.random() * 150) + 50;
          }
          
          return {
            id: `${flight.flightNo}-${formatDateKST(departureDate, 'YYYYMMDD-HHmm')}`,
            flightCode: flight.flightNo,
            airline: flight.airline,
            departureAirport: flight.departureAirport,
            departureCity: getCityName(flight.departureAirport),
            arrivalAirport: flight.arrivalAirport,
            arrivalCity: getCityName(flight.arrivalAirport),
            departureTime: formatDateKST(departureDate, 'HH:mm'),
            arrivalTime: formatDateKST(arrivalDate, 'HH:mm'),
            duration: `${hours}시간 ${minutes}분`,
            date: formatDateKST(departureDate, 'YYYY-MM-DD'),
            // 실제 API에서 가져온 좌석 및 가격 정보
            businessPrice,
            economyPrice,
            businessSeatsAvailable,
            economySeatsAvailable,
          };
        });
          // 프론트엔드에서 정렬 처리
        const sortedFlights = sortFlightsByOption(uiFlights, sortBy);
        setFlights(sortedFlights);
      } catch (err) {
        setError("항공편을 불러오는 중 오류가 발생했습니다.");
        console.error("Error fetching flights:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadFlights();
  }, [departureAirport, arrivalAirport, departureDateStr, sortBy]);
    // 도시 코드를 도시 이름으로 변환하는 함수
  // 비동기 함수를 사용하지 않고 클라이언트 측에서 캐싱하여 사용
  const [airportCache, setAirportCache] = useState<Record<string, string>>({});
  
  // 도시 코드를 도시 이름으로 변환하는 간단한 함수
  const getCityName = (airportCode: string): string => {
    // 캐시에 있으면 캐시에서 가져옴
    if (airportCache[airportCode]) {
      const airportInfo = airportCache[airportCode];
      // 공항 이름 추출 (예: "인천 (ICN)"에서 "인천"을 추출)
      const match = airportInfo.match(/^(.+)\s\(/);
      return match ? match[1] : airportCode;
    }
    
    return airportCode;
  };
    // 날짜 캐러셀에 표시할 날짜 계산 - selectedDate가 변경될 때만 실행
  useEffect(() => {    
    const currentDate = selectedDate;
    const dates: Date[] = [];
    
    // 선택된 날짜 기준으로 앞뒤 3일씩 표시
    for (let i = -3; i <= 3; i++) {
      dates.push(new Date(currentDate.getTime() + i * 24 * 60 * 60 * 1000));
    }
    
    setDisplayDates(dates);
  }, [selectedDate]);  // 항공편 정렬 함수
  const sortFlightsByOption = (flights: UIFlight[], sortOption: string): UIFlight[] => {
    // 정렬된 항공편 배열의 복사본 생성
    const sortedFlights = [...flights];
    
    switch (sortOption) {
      // 이코노미 가격 순 (오름차순)
      case "economyPrice":
        return sortedFlights.sort((a, b) => a.economyPrice - b.economyPrice);
      
      // 이코노미 가격 역순 (내림차순)  
      case "-economyPrice":
        return sortedFlights.sort((a, b) => b.economyPrice - a.economyPrice);

      // 비즈니스 가격 순 (오름차순)
      case "businessPrice":
        return sortedFlights.sort((a, b) => a.businessPrice - b.businessPrice);
      
      // 비즈니스 가격 역순 (내림차순)  
      case "-businessPrice":
        return sortedFlights.sort((a, b) => b.businessPrice - a.businessPrice);
        
      // 항공사 순 (알파벳 순)
      case "airline":
        return sortedFlights.sort((a, b) => a.airline.localeCompare(b.airline));
        
      // 출발 시간 역순
      case "-departureDateTime":
        return sortedFlights.sort((a, b) => {
          // 날짜와 시간 문자열 조합
          const dateA = `${a.date} ${a.departureTime}`;
          const dateB = `${b.date} ${b.departureTime}`;
          return dateB.localeCompare(dateA);
        });
        
      // 출발 시간 순 (기본값)
      case "departureDateTime":
      default:
        return sortedFlights.sort((a, b) => {
          // 날짜와 시간 문자열 조합
          const dateA = `${a.date} ${a.departureTime}`;
          const dateB = `${b.date} ${b.departureTime}`;
          return dateA.localeCompare(dateB);
        });
    }
  };
  
  // 날짜 선택 처리
  const handleDateSelect = (date: Date) => {
    // 먼저 state를 즉시 업데이트하여 UI에서 캐러셀과 검색 폼이 동기화되도록 함
    setSelectedDate(date);
    
    // URL 파라미터 업데이트
    const params = new URLSearchParams(searchParams.toString());
    params.set("departureDate", formatDateKST(date, 'YYYY-MM-DD'));
    navigate(`/flights?${params.toString()}`, { replace: true });
  };return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* 검색 폼 */}
        <section className="w-full py-4 md:py-2 lg:py-8">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="max-w-3xl mx-auto">                <FlightSearchForm 
                key={`search-form-${formatDateKST(selectedDate, 'YYYY-MM-DD')}`}
                defaultValues={{
                  departureAirport,
                  arrivalAirport,
                  date: selectedDate,
                  passengers
                }}
              />
            </div>
          </div>
        </section>
      {/* 날짜 캐러셀 */}
        <div className="mb-6 flex justify-center">
          <div className="w-full max-w-2xl relative">
            <div className="flex items-center justify-center mb-2">
              <LucideIcon name="Calendar" className="h-4 w-4 mr-2 text-primary" />
              <span className="text-sm font-medium">날짜 선택</span>
            </div>
            <Carousel
              opts={{
                align: "center",
                loop: false,
              }}
              className="w-full"
            >            <CarouselContent className="-ml-2 md:-ml-4">
              {displayDates.map((date, index) => {
                const isSelected = formatDateKST(date, 'YYYY-MM-DD') === formatDateKST(selectedDate, 'YYYY-MM-DD');
                
                return (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-[100px] md:basis-[120px]">
                    <div 
                      onClick={() => handleDateSelect(date)}
                      className={`flex flex-col items-center p-3 rounded-lg cursor-pointer w-full
                        ${isSelected 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-card hover:bg-muted border'
                        }`}
                    >
                      <span className="text-sm">{format(date, 'EEE', { locale: ko })}</span>
                      <span className="text-lg font-medium">{format(date, 'd', { locale: ko })}</span>
                      <span className="text-xs">{format(date, 'MMM', { locale: ko })}</span>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="sm:flex left-0 lg:-left-4" />
            <CarouselNext className="sm:flex right-0 lg:-right-4" />
          </Carousel>
        </div>
      </div>
      
      {/* 정렬 옵션 */}      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground flex items-center">
          <LucideIcon name="Search" className="h-3 w-3 mr-1" />
          {loading ? (
            <span>항공편을 검색 중입니다...</span>
          ) : error ? (
            <span className="text-destructive">{error}</span>
          ) : (
            <span>총 {totalFlights}개의 항공편이 
              {sortBy.includes("economy") ? " 가격순으로 " : " 출발시간순으로 "}
              정렬되었습니다.
            </span>
          )}
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="정렬 기준" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {/* 항공편 목록 */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
            <div className="text-lg font-medium">항공편을 검색 중입니다...</div>
          </div>
        ) : flights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-muted/30 rounded-lg">
            <LucideIcon name="SearchX" className="h-12 w-12 text-muted-foreground mb-4" />
            <div className="text-lg font-medium mb-2">검색 결과가 없습니다.</div>
            <div className="text-sm text-muted-foreground mb-4">
              다른 날짜나 항공편을 검색해보세요.
            </div>
          </div>
        ) : (
          flights.map((flight) => (
          <Card key={flight.id} className="overflow-hidden">
            <div className="grid sm:grid-cols-1 lg:grid-cols-10 gap-0">
              {/* 항공편 정보 - 좌측 */}
              <div className="lg:col-span-4 p-6">                <div className="flex items-center gap-2 mb-3">
                  <LucideIcon name="Plane" className="h-4 w-4 text-primary" />
                  <span className="font-bold">{flight.airline}</span>
                  <span className="text-sm text-muted-foreground">{flight.flightCode}</span>
                </div>
                  <div className="flex items-center justify-between mb-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{flight.departureTime}</div>
                    <div className="text-sm text-muted-foreground">
                      {airportCache[flight.departureAirport] 
                        ? airportCache[flight.departureAirport].split(' (')[0] + ' (' + flight.departureAirport + ')'
                        : flight.departureCity + ' (' + flight.departureAirport + ')'}
                    </div>
                  </div>
                  
                  <div className="flex-1 mx-4 relative">
                    <div className="border-t border-dashed border-muted-foreground"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">{flight.duration}</div>
                  </div>
                    <div className="text-center">
                    <div className="text-2xl font-bold">{flight.arrivalTime}</div>
                    <div className="text-sm text-muted-foreground">
                      {airportCache[flight.arrivalAirport] 
                        ? airportCache[flight.arrivalAirport].split(' (')[0] + ' (' + flight.arrivalAirport + ')'
                        : flight.arrivalCity + ' (' + flight.arrivalAirport + ')'}
                    </div>
                  </div>
                </div>
              </div>
                {/* 가격 및 예약 - 우측 */}
              <div className="lg:col-span-6 grid grid-cols-2 border-t lg:border-t-0 lg:border-l border-border">                {/* 비즈니스석 */}
                {flight.businessSeatsAvailable > 0 ? (
                  <div 
                    className="p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted h-full"
                    onClick={() => {
                      // 기존 검색 파라미터를 복사
                      const params = new URLSearchParams(searchParams.toString());
                      
                      // 좌석 예약에 필요한 추가 파라미터 설정
                      params.set("flightId", flight.id.toString());
                      params.set("seatType", "business");
                      params.set("price", flight.businessPrice.toString());
                      params.set("passengers", passengers.toString());
                      params.set("flightCode", flight.flightCode);
                      params.set("airline", flight.airline);
                      params.set("departureTime", flight.departureTime);
                      params.set("arrivalTime", flight.arrivalTime);
                      
                      navigate(`/payment?${params.toString()}`);
                    }}
                  >
                    <div className="text-sm uppercase mb-1 flex items-center justify-center gap-1">
                      <LucideIcon name="Star" className="h-3 w-3" /> 비즈니스
                    </div>
                    <div className="font-bold text-xl">
                      {flight.businessPrice.toLocaleString()}원
                    </div>
                    <div className="text-xs text-muted-foreground">
                      잔여 {flight.businessSeatsAvailable}석
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col items-center justify-center bg-muted/30 h-full">
                    <div className="text-sm uppercase mb-1 text-muted-foreground flex items-center justify-center gap-1">
                      <LucideIcon name="Star" className="h-3 w-3" /> 비즈니스
                    </div>
                    <div className="font-bold">마감</div>
                  </div>
                )}
                  {/* 이코노미석 */}
                {flight.economySeatsAvailable > 0 ? (
                  <div 
                    className="p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted border-l border-border h-full"
                    onClick={() => {
                      // 기존 검색 파라미터를 복사
                      const params = new URLSearchParams(searchParams.toString());
                      
                      // 좌석 예약에 필요한 추가 파라미터 설정
                      params.set("flightId", flight.id.toString());
                      params.set("seatType", "economy");
                      params.set("price", flight.economyPrice.toString());
                      params.set("passengers", passengers.toString());
                      params.set("flightCode", flight.flightCode);
                      params.set("airline", flight.airline);
                      params.set("departureTime", flight.departureTime);
                      params.set("arrivalTime", flight.arrivalTime);
                      
                      navigate(`/payment?${params.toString()}`);
                    }}
                  >
                    <div className="text-sm uppercase mb-1 flex items-center justify-center gap-1">
                      <LucideIcon name="Armchair" className="h-3 w-3" /> 이코노미
                    </div>
                    <div className="font-bold text-xl">
                      {flight.economyPrice.toLocaleString()}원
                    </div>
                    <div className="text-xs text-muted-foreground">
                      잔여 {flight.economySeatsAvailable}석
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex flex-col items-center justify-center bg-muted/30 border-l border-border h-full">
                    <div className="text-sm uppercase mb-1 text-muted-foreground flex items-center justify-center gap-1">
                      <LucideIcon name="Armchair" className="h-3 w-3" /> 이코노미
                    </div>
                    <div className="font-bold">마감</div>
                  </div>
                )}</div>
            </div>
          </Card>
        )))}
      </div>
    </div>
  );
}