import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LucideIcon from "../icons/lucideIcon";
import AirportSelectorPopover, { type Airport } from "./airportSelectorPopover";
import DateSelectorPopover from "./dateSelectorPopover";
import { getAirportByCode } from "../../lib/airportService";
import { formatDateKST } from "../../lib/utils";

interface FlightSearchFormProps {
  defaultValues?: {
    departureAirport?: string;
    arrivalAirport?: string;
    date?: Date;
    passengers?: number;
  };
}

export default function FlightSearchForm({ defaultValues }: FlightSearchFormProps) {  const navigate = useNavigate();  const [date, setDate] = useState<Date | undefined>(defaultValues?.date);
//  const [returnDate, setReturnDate] = useState<Date>();
  const [tripType, setTripType] = useState("oneway");
  const [departureAirport, setDepartureAirport] = useState<Airport | undefined>(undefined);
  const [arrivalAirport, setArrivalAirport] = useState<Airport | undefined>(undefined);
  // passengers는 지금은 동적으로 변경되지 않지만 향후 기능 확장을 위해 state로 관리
  const [passengers] = useState<number>(defaultValues?.passengers || 1);
  const [isSearching, setIsSearching] = useState(false);
  // 날짜 정보 업데이트 (defaultValues.date가 바뀔 때마다)
  useEffect(() => {
    if (defaultValues?.date) {
      setDate(defaultValues.date);
    }
  }, [defaultValues?.date]);
  // 공항 정보 불러오기
  useEffect(() => {
    async function loadAirportData() {
      try {
        // 출발지 공항 정보 불러오기
        if (defaultValues?.departureAirport) {
          const airport = await getAirportByCode(defaultValues.departureAirport);
          if (airport) {
            setDepartureAirport(airport);
          }
        }

        // 도착지 공항 정보 불러오기
        if (defaultValues?.arrivalAirport) {
          const airport = await getAirportByCode(defaultValues.arrivalAirport);
          if (airport) {
            setArrivalAirport(airport);
          }
        }
      } catch (error) {
        console.error('공항 정보 로딩 중 오류 발생:', error);
      }
    }

    loadAirportData();
  }, [defaultValues?.departureAirport, defaultValues?.arrivalAirport]);  const handleSearch = () => {
    if (!departureAirport || !arrivalAirport || !date) {
      alert('출발지, 도착지, 출발 날짜를 모두 선택해주세요.');
      return;
    }
    
    setIsSearching(true);
    // URL 파라미터를 사용하여 flights 페이지로 이동
    const searchParams = new URLSearchParams();
    searchParams.append('departureAirport', departureAirport.code);
    searchParams.append('arrivalAirport', arrivalAirport.code);
    
    // formatDateKST 함수 사용하여 날짜 형식 지정
    searchParams.append('departureDate', formatDateKST(date, 'YYYY-MM-DD'));
    searchParams.append('passengers', passengers.toString());

    // flights 페이지로 이동
    navigate(`/flights?${searchParams.toString()}`);
    
    // 약간의 지연 후에 isSearching 상태를 false로 변경 (다음 검색 가능하도록)
    setTimeout(() => {
      setIsSearching(false);
    }, 800);
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="oneway" value={tripType} onValueChange={setTripType}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="roundtrip" disabled>왕복</TabsTrigger>
            <TabsTrigger value="oneway" className="font-bold">편도</TabsTrigger>
            <TabsTrigger value="multi-city" disabled>다구간</TabsTrigger>
          </TabsList>
          
          <TabsContent value="roundtrip" className="space-y-4">
            Not Implemented
          </TabsContent>

          <TabsContent value="oneway" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <AirportSelectorPopover
                placeholder="출발지"
                selectedAirport={departureAirport}
                onAirportSelect={setDepartureAirport}
              />
              <AirportSelectorPopover
                placeholder="도착지"
                selectedAirport={arrivalAirport}
                onAirportSelect={setArrivalAirport}
                excludeAirport={departureAirport}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 font-bold">
              <DateSelectorPopover
                date={date}
                onDateSelect={setDate}
                placeHolder="출발 날짜"
              />
              <div>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-bold"
                >
                  <LucideIcon name="Users" className="mr-2 h-4 w-4" />
                  성인 {passengers}인
                </Button>
              </div>
            </div>
            <Button 
              className="w-full font-bold" 
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  항공편 검색 중...
                </>
              ) : (
                '항공편 검색'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="multi-city" className="space-y-4">
            Not Implemented
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}