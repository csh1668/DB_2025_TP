import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import LucideIcon from "../icons/lucideIcon";
import { cn } from "../../lib/utils";
import { getAllAirports, getCountries } from "../../lib/airportService";

// 공항 정보 타입 정의
export type Airport = {
  id: string;
  name: string;
  code: string;
  country: string;
};

interface AirportSelectorPopoverProps {
  selectedAirport?: Airport;
  onAirportSelect: (airport: Airport) => void;
  placeholder?: string;
  excludeAirport?: Airport; // 출발 공항은 도착 공항에서 제외
}

export default function AirportSelectorPopover({
  selectedAirport,
  onAirportSelect,
  placeholder = "공항 선택",
  excludeAirport
}: AirportSelectorPopoverProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [filteredAirports, setFilteredAirports] = useState<Airport[]>([]);
  const [open, setOpen] = useState(false);
  const [recentAirports, setRecentAirports] = useState<Airport[]>([]);
  
  // 공항 데이터와 국가 목록을 저장하는 상태
  const [airports, setAirports] = useState<Airport[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 컴포넌트가 마운트될 때 공항 데이터 로드
  useEffect(() => {
    const fetchAirportData = async () => {
      setIsLoading(true);
      try {
        // 모든 공항 데이터 가져오기
        const airportsData = await getAllAirports();
        setAirports(airportsData);
        
        // 국가 목록 가져오기
        const countriesData = await getCountries();
        setCountries(countriesData);
        
        if (countriesData.length > 0) {
          setSelectedCountry(countriesData[0]);
        }
      } catch (error) {
        console.error('공항 데이터를 불러오는데 실패했습니다:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAirportData();
  }, []);
  
  // localStorage에서 최근 검색 공항 불러오기 - 컴포넌트 마운트 시
  useEffect(() => {
    loadRecentAirports();
  }, []);
  
  // Popover가 열릴 때마다 localStorage와 동기화
  useEffect(() => {
    if (open) {
      loadRecentAirports();
    }
  }, [open]);
  
  // localStorage에서 데이터 불러오는 함수
  const loadRecentAirports = () => {
    try {
      const savedAirports = localStorage.getItem('recentAirports');
      if (savedAirports) {
        setRecentAirports(JSON.parse(savedAirports));
      }
    } catch (error) {
      console.error('Error loading recent airports from localStorage:', error);
    }
  };

  // 최근 검색 공항을 localStorage에 저장
  const saveRecentAirports = (airports: Airport[]) => {
    try {
      localStorage.setItem('recentAirports', JSON.stringify(airports));
      setRecentAirports(airports);
    } catch (error) {
      console.error('Error saving recent airports to localStorage:', error);
    }
  };

  // 검색어나 선택된 국가, 또는 제외 공항이 변경될 때 공항 목록 필터링
  useEffect(() => {
    let filtered = [...airports];
    
    // 검색어로 필터링
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(airport => 
        airport.name.toLowerCase().includes(query) || 
        airport.code.toLowerCase().includes(query)
      );
    } else if (selectedCountry) {
      // 검색어가 없을 때는 선택된 국가로 필터링
      filtered = filtered.filter(airport => airport.country === selectedCountry);
    }
    
    // excludeAirport가 있으면 해당 공항 제외
    if (excludeAirport) {
      filtered = filtered.filter(airport => airport.id !== excludeAirport.id);
    }
    
    setFilteredAirports(filtered);
    
  }, [searchQuery, selectedCountry, excludeAirport, airports]);

  // 최근 검색 공항 추가
  const handleSelectAirport = (airport: Airport) => {
    onAirportSelect(airport);
    setOpen(false);
    setSearchQuery("");
    
    // 중복 제거, 최대 5개
    const filtered = recentAirports.filter(a => a.id !== airport.id);
    const updated = [airport, ...filtered].slice(0, 5);
    saveRecentAirports(updated);
  };

  // 최근 검색 공항 제거
  const removeRecentAirport = (e: React.MouseEvent, airportId: string) => {
    e.stopPropagation(); // 버블링 방지
    const updated = recentAirports.filter(airport => airport.id !== airportId);
    saveRecentAirports(updated);
  };

  // 검색창 초기화 함수
  const resetSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="relative font-neo">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between font-neo font-bold text-2xl p-6 cursor-pointer",
              !selectedAirport && "text-muted-foreground"
            )}
          >
            {selectedAirport ? (
              <span>
                {selectedAirport.name} <span className="text-muted-foreground/70">({selectedAirport.code})</span>
              </span>
            ) : (
              placeholder
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[700px] p-0 font-neo" 
          align="center"
          alignOffset={0}
          side="bottom"
          sideOffset={5}
        >
          {isLoading ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>공항 정보를 불러오는 중...</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* 검색 영역 */}
              <div className="p-3 border-b border-border bg-card">
                <div className="flex items-center gap-2">
                  <LucideIcon name="Search" className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="공항 이름 또는 코드 검색"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 font-neo"
                  />
                  {searchQuery && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 cursor-pointer" 
                      onClick={resetSearch}
                    >
                      <LucideIcon name="X" className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {/* 최근 검색 공항 */}
              {recentAirports.length > 0 && !searchQuery && (
                <div className="border-b border-border bg-muted px-4 py-2 flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-muted-foreground mr-2">최근 검색:</span>
                  {recentAirports.map((airport) => (
                    <div
                      key={airport.id}
                      className="flex items-center text-xs px-2 py-1 rounded bg-muted-foreground/20 hover:bg-muted-foreground/30 font-neo group cursor-pointer"
                    >
                      <button 
                        className="flex-1 flex items-center cursor-pointer"
                        onClick={() => handleSelectAirport(airport)}
                      >
                        {airport.name} <span className="text-muted-foreground/70">({airport.code})</span>
                      </button>
                      <button
                        className="ml-1 p-0.5 rounded-full hover:bg-muted-foreground/40 opacity-70 hover:opacity-100 cursor-pointer"
                        onClick={(e) => removeRecentAirport(e, airport.id)}
                      >
                        <LucideIcon name="X" className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* 국가/공항 선택 영역 */}
              {searchQuery ? (
                <div className="max-h-[300px] overflow-y-auto py-2 border-b border-border">
                  {filteredAirports.length > 0 ? (
                    filteredAirports.map((airport) => (
                      <div
                        key={airport.id}
                        className="flex items-center px-4 py-2 cursor-pointer hover:bg-accent font-neo"
                        onClick={() => handleSelectAirport(airport)}
                      >
                        <LucideIcon name="Plane" className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{airport.name} <span className="text-muted-foreground/70">({airport.code})</span></span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-center text-muted-foreground font-neo">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[400px] flex w-full">
                  {/* 국가 리스트 */}
                  <div className="w-1/4 h-full border-r border-border bg-muted overflow-y-auto flex flex-col font-neo">
                    {countries.map((country) => (
                      <button
                        key={country}
                        onClick={() => setSelectedCountry(country)}
                        className={cn(
                          "text-left px-3 py-2 hover:bg-accent border-b border-border/50 font-neo cursor-pointer",
                          selectedCountry === country ? "bg-accent font-bold" : "font-normal"
                        )}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                  {/* 공항 리스트 */}
                  <div className="w-3/4 h-full overflow-y-auto font-neo">
                    {filteredAirports.map((airport) => (
                      <div
                        key={airport.id}
                        className="flex items-center px-4 py-2 cursor-pointer hover:bg-accent font-neo"
                        onClick={() => handleSelectAirport(airport)}
                      >
                        <LucideIcon name="Plane" className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>
                          {airport.name} <span className="text-muted-foreground/70">({airport.code})</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}