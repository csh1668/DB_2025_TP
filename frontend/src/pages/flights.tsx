import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Card,
} from "@/components/ui/card";
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

// 임시 데이터
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
    date: "2025-05-26",
    businessPrice: 550000,
    economyPrice: 250000,
    businessSeatsAvailable: 10,
    economySeatsAvailable: 150,
  },
  {
    id: 2,
    flightCode: "OZ456",
    airline: "아시아나항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "NRT",
    arrivalCity: "도쿄",
    departureTime: "10:15",
    arrivalTime: "12:45",
    duration: "2시간 30분",
    date: "2025-05-26",
    businessPrice: 530000,
    economyPrice: 240000,
    businessSeatsAvailable: 8,
    economySeatsAvailable: 0,
  },
  {
    id: 3,
    flightCode: "7C890",
    airline: "제주항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "NRT",
    arrivalCity: "도쿄",
    departureTime: "13:00",
    arrivalTime: "15:30",
    duration: "2시간 30분",
    date: "2025-05-26",
    businessPrice: 0, // 없음
    economyPrice: 180000,
    businessSeatsAvailable: 0,
    economySeatsAvailable: 180,
  },
  {
    id: 4,
    flightCode: "KE789",
    airline: "대한항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "NRT",
    arrivalCity: "도쿄",
    departureTime: "16:45",
    arrivalTime: "19:15",
    duration: "2시간 30분",
    date: "2025-05-26",
    businessPrice: 580000,
    economyPrice: 270000,
    businessSeatsAvailable: 12,
    economySeatsAvailable: 140,
  },
  {
    id: 5,
    flightCode: "TW789",
    airline: "티웨이항공",
    departureAirport: "ICN",
    departureCity: "서울",
    arrivalAirport: "NRT",
    arrivalCity: "도쿄",
    departureTime: "19:30",
    arrivalTime: "22:00",
    duration: "2시간 30분",
    date: "2025-05-26",
    businessPrice: 0, // 없음
    economyPrice: 190000,
    businessSeatsAvailable: 0,
    economySeatsAvailable: 200,
  }
];

// 정렬 옵션
const sortOptions = [
  { value: "departureTime", label: "출발시간 순" },
  { value: "arrivalTime", label: "도착시간 순" },
  { value: "duration", label: "비행시간 순" },
  { value: "economyPrice", label: "이코노미 가격 순" },
  { value: "businessPrice", label: "비즈니스 가격 순" },
];

export default function FlightsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [displayDates, setDisplayDates] = useState<Date[]>([]);
  const [sortBy, setSortBy] = useState<string>("departureTime");
  const [flights, setFlights] = useState(temporaryFlights);
  
  // URL에서 검색 파라미터 추출
  const departureAirport = searchParams.get("departureAirport") || "ICN";
  const arrivalAirport = searchParams.get("arrivalAirport") || "NRT";
  const dateParam = searchParams.get("date");
  const passengers = Number(searchParams.get("passengers")) || 1;
    // 날짜 설정
  useEffect(() => {
    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }
  }, [dateParam]);
  
  // 날짜 캐러셀에 표시할 날짜 계산 - selectedDate가 변경될 때만 실행
  useEffect(() => {    
    const currentDate = selectedDate;
    const dates: Date[] = [];
    
    // 선택된 날짜 기준으로 앞뒤 3일씩 표시
    for (let i = -3; i <= 3; i++) {
      dates.push(addDays(currentDate, i));
    }
    
    setDisplayDates(dates);
  }, [selectedDate]);
  
  // 정렬 처리
  useEffect(() => {
    const sortedFlights = [...temporaryFlights].sort((a, b) => {
      switch (sortBy) {
        case "departureTime":
          return a.departureTime.localeCompare(b.departureTime);
        case "arrivalTime":
          return a.arrivalTime.localeCompare(b.arrivalTime);
        case "economyPrice":
          return a.economyPrice - b.economyPrice;
        case "businessPrice":
          return (a.businessPrice || Number.MAX_VALUE) - (b.businessPrice || Number.MAX_VALUE);
        default:
          return 0;
      }
    });
    
    setFlights(sortedFlights);
  }, [sortBy]);
  // 날짜 선택 처리
  const handleDateSelect = (date: Date) => {
    // URL 파라미터만 업데이트 (state는 useEffect에서 처리됨)
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(date, 'yyyy-MM-dd'));
    navigate(`/flights?${params.toString()}`, { replace: true });
    
    // 임시 데이터이므로 지금은 그냥 같은 데이터 보여줌
  };return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* 검색 폼 */}
        <section className="w-full py-4 md:py-2 lg:py-8">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="max-w-3xl mx-auto">
              <FlightSearchForm defaultValues={{
                departureAirport,
                arrivalAirport,
                date: selectedDate,
                passengers
              }}/>
            </div>
          </div>
        </section>
        {/* 날짜 캐러셀 */}      <div className="mb-6 flex justify-center">
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
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {displayDates.map((date, index) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                
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
          총 {flights.length}개의 항공편이 검색되었습니다.
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
      </div>      {/* 항공편 목록 */}
      <div className="space-y-4">
        {flights.map((flight) => (
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
                    <div className="text-sm text-muted-foreground">{flight.departureAirport}</div>
                  </div>
                  
                  <div className="flex-1 mx-4 relative">
                    <div className="border-t border-dashed border-muted-foreground"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">{flight.duration}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold">{flight.arrivalTime}</div>
                    <div className="text-sm text-muted-foreground">{flight.arrivalAirport}</div>
                  </div>
                </div>
              </div>
              
              {/* 가격 및 예약 - 우측 */}
              <div className="lg:col-span-6 grid grid-cols-2 border-t lg:border-t-0 lg:border-l border-border">                {/* 비즈니스석 */}
                {flight.businessSeatsAvailable > 0 ? (
                  <div 
                    className="p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted h-full"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set("flightId", flight.id.toString());
                      params.set("seatType", "business");
                      params.set("price", flight.businessPrice.toString());
                      params.set("passengers", passengers.toString());
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
                      const params = new URLSearchParams();
                      params.set("flightId", flight.id.toString());
                      params.set("seatType", "economy");
                      params.set("price", flight.economyPrice.toString());
                      params.set("passengers", passengers.toString());
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
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}