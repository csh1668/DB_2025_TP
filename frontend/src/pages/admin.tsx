import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import LucideIcon from "@/components/icons/lucideIcon";
import {
  statisticsService,
  type AirlineRevenueRank,
  type AirportAirlineRevenueRank,
  type AirportAirlineRevenueSummary,
  type MonthlyAirlineRevenueTrend
} from "@/lib/statisticsService";

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// 차트에서 사용할 색상 배열
const backgroundColors = [
  'rgba(255, 99, 132, 0.6)',
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 206, 86, 0.6)',
  'rgba(75, 192, 192, 0.6)',
  'rgba(153, 102, 255, 0.6)',
  'rgba(255, 159, 64, 0.6)',
  'rgba(255, 99, 132, 0.6)',
  'rgba(54, 162, 235, 0.6)',
  'rgba(255, 206, 86, 0.6)',
];

// 차트에서 사용할 border 색상 배열
const borderColors = [
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
  'rgba(75, 192, 192, 1)',
  'rgba(153, 102, 255, 1)',
  'rgba(255, 159, 64, 1)',
  'rgba(255, 99, 132, 1)',
  'rgba(54, 162, 235, 1)',
  'rgba(255, 206, 86, 1)',
];

// 숫자 포맷팅 함수
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("airline-revenue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 드롭다운 선택 상태
  const [selectedAirport, setSelectedAirport] = useState<string>("");
  const [selectedAirline, setSelectedAirline] = useState<string>("");
  
  // 통계 데이터 상태
  const [airlineRevenueData, setAirlineRevenueData] = useState<AirlineRevenueRank[]>([]);
  const [airportAirlineData, setAirportAirlineData] = useState<AirportAirlineRevenueRank[]>([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState<MonthlyAirlineRevenueTrend[]>([]);
  const [airportRevenueSummary, setAirportRevenueSummary] = useState<AirportAirlineRevenueSummary[]>([]);
  
  // 공항 및 항공사 목록
  const airports = [...new Set(airportAirlineData.map(item => item.DEPARTUREAIRPORT))];
  const airlines = [...new Set(monthlyRevenueData.map(item => item.AIRLINE))];

  // 데이터 로드 함수
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 항공사별 매출
      const airlineRevenue = await statisticsService.getAirlineRevenue();
      setAirlineRevenueData(airlineRevenue);
      
      // 출발지 및 항공사별 매출
      const airportAirlineRevenue = await statisticsService.getAirportAirlineRevenue();
      setAirportAirlineData(airportAirlineRevenue);
        // 월별 매출 추이
      const monthlyRevenue = await statisticsService.getMonthlyRevenueTrends();
      setMonthlyRevenueData(monthlyRevenue);
      
      // 공항 및 항공사별 매출 요약 (ROLLUP)
      const revenueSummary = await statisticsService.getAirportAirlineRevenueSummary();
      setAirportRevenueSummary(revenueSummary);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
    // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadData();
  }, []);
  
  // 데이터 로드 후 드롭다운 초기값 설정
  useEffect(() => {
    if (!loading) {
      // 초기 공항 선택
      if (airportAirlineData.length > 0 && !selectedAirport) {
        const firstAirport = airportAirlineData[0].DEPARTUREAIRPORT;
        setSelectedAirport(firstAirport);
      }
      
      // 초기 항공사 선택
      if (airlines.length > 0 && !selectedAirline) {
        const firstAirline = airlines[0];
        setSelectedAirline(firstAirline);
      }
    }
  }, [loading, airportAirlineData, selectedAirport, airlines, selectedAirline]);
  
  // 항공사별 매출 차트 데이터
  const airlineRevenueChartData = {
    labels: airlineRevenueData.map(item => item.AIRLINE),
    datasets: [
      {
        label: '총 매출액 (원)',
        data: airlineRevenueData.map(item => item.TOTAL_REVENUE),
        backgroundColor: backgroundColors.slice(0, airlineRevenueData.length),
        borderColor: borderColors.slice(0, airlineRevenueData.length),
        borderWidth: 1,
      },
    ],
  };
  // 월별 매출 추이 라인 차트를 위한 데이터 준비 (모든 항공사 표시)
  // 고유한 연도-월 조합을 얻어 정렬
  const uniqueMonths = [...new Set(monthlyRevenueData.map(item => `${item.REVENUE_YEAR}-${item.REVENUE_MONTH}`))].sort();
  
  const monthlyRevenueChartData = {
    labels: uniqueMonths,
    datasets: airlines.map((airline, index) => ({
      label: airline,
      data: uniqueMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const dataPoint = monthlyRevenueData.find(
          item => item.AIRLINE === airline && 
          item.REVENUE_YEAR.toString() === year && 
          item.REVENUE_MONTH.toString() === monthNum
        );
        return dataPoint ? dataPoint.MONTHLY_REVENUE : 0;
      }),
      borderColor: borderColors[index % borderColors.length],
      backgroundColor: backgroundColors[index % backgroundColors.length],
      tension: 0.4,
      fill: false,
    })),
  };
  
  // 특정 공항의 항공사별 매출 순위 데이터 필터링
  const getAirportData = (airport: string) => {
    return airportAirlineData
      .filter(item => item.DEPARTUREAIRPORT === airport)
      .sort((a, b) => a.REVENUE_RANK - b.REVENUE_RANK);
  };
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* 관리자 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LucideIcon name="ChartLine" className="h-8 w-8 text-primary" />
          항공 통계 대시보드
        </h1>
        <p className="text-muted-foreground">
          항공사 및 공항별 매출과 좌석 정보 등 다양한 통계를 확인하세요.
        </p>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <LucideIcon name="CircleAlert" className="h-4 w-4" />
          <AlertTitle>오류 발생</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* 탭 네비게이션 */}
      <Tabs defaultValue="airline-revenue" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="airline-revenue" className="flex items-center gap-1">
            <LucideIcon name="ChartBar" className="h-4 w-4" /> 항공사별 매출
          </TabsTrigger>
          <TabsTrigger value="airport-airline" className="flex items-center gap-1">
            <LucideIcon name="Map" className="h-4 w-4" /> 공항별 매출
          </TabsTrigger>
          <TabsTrigger value="monthly-trends" className="flex items-center gap-1">
            <LucideIcon name="TrendingUp" className="h-4 w-4" /> 월별 매출 추이
          </TabsTrigger>
        </TabsList>

        {/* 항공사별 매출 탭 */}
        <TabsContent value="airline-revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>항공사별 총 매출 차트</CardTitle>
                <CardDescription>
                  각 항공사의 예약 매출액을 표시합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <LucideIcon name="Loader" className="h-8 w-8 mx-auto animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">데이터 로딩 중...</p>
                    </div>
                  </div>
                ) : (
                  <Bar
                    data={airlineRevenueChartData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `매출: ${formatNumber(context.raw as number)}원`;
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return `${(value as number) / 10000}만원`;
                            }
                          }
                        }
                      }
                    }}
                    height={100}
                  />
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>항공사별 매출 순위</CardTitle>
                <CardDescription>
                  항공사별 총 매출액과 예약 건수를 보여줍니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <LucideIcon name="Loader" className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순위</TableHead>
                        <TableHead>항공사</TableHead>
                        <TableHead className="text-right">매출액</TableHead>
                        <TableHead className="text-right">예약 수</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {airlineRevenueData.map((airline, index) => (
                        <TableRow key={airline.AIRLINE}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{airline.AIRLINE}</TableCell>
                          <TableCell className="text-right">{formatNumber(airline.TOTAL_REVENUE)}원</TableCell>
                          <TableCell className="text-right">{airline.RESERVATION_COUNT}건</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>        {/* 공항별 항공사 매출 탭 */}
        <TabsContent value="airport-airline" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>공항별 항공사 매출 순위</CardTitle>
                  <CardDescription>
                    선택한 공항에서 출발하는 항공편의 항공사별 매출 순위입니다.
                  </CardDescription>
                </div>
                {!loading && (
                  <div className="flex items-center">
                    <Select 
                      defaultValue={airports[0]}
                      onValueChange={(value) => {
                        // 선택된 공항 업데이트
                        setSelectedAirport(value);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="공항 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {airports.map((airport) => (
                          <SelectItem key={airport} value={airport}>{airport}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <LucideIcon name="Loader" className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>순위</TableHead>
                        <TableHead>항공사</TableHead>
                        <TableHead className="text-right">매출액</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAirportData(selectedAirport).map((item) => (
                        <TableRow key={`${item.DEPARTUREAIRPORT}-${item.AIRLINE}`}>
                          <TableCell className="font-medium">{item.REVENUE_RANK}</TableCell>
                          <TableCell>{item.AIRLINE}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.TOTAL_REVENUE)}원</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 공항 및 항공사별 매출 요약 (ROLLUP) */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>공항 및 항공사별 매출 요약</CardTitle>
              <CardDescription>
                공항 및 항공사별 매출 합계와 전체 매출 총계를 보여줍니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <LucideIcon name="Loader" className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>공항</TableHead>
                      <TableHead>항공사</TableHead>
                      <TableHead className="text-right">매출액</TableHead>
                      <TableHead className="text-right">예약 수</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {airportRevenueSummary.map((item, index) => (
                      <TableRow 
                        key={`${item.DEPARTUREAIRPORT}-${item.AIRLINE}-${index}`}
                        className={
                          item.SUMMARY_LEVEL === 3 ? "font-bold bg-muted" : 
                          item.SUMMARY_LEVEL === 2 ? "font-semibold bg-muted/50" :
                          item.SUMMARY_LEVEL === 1 ? "font-semibold bg-muted/50" : ""
                        }
                      >
                        <TableCell>{item.DEPARTUREAIRPORT}</TableCell>
                        <TableCell>{item.AIRLINE}</TableCell>
                        <TableCell className="text-right">{formatNumber(item.TOTAL_REVENUE)}원</TableCell>
                        <TableCell className="text-right">{formatNumber(item.RESERVATION_COUNT)}건</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
          {/* 월별 매출 추이 탭 */}
        <TabsContent value="monthly-trends" className="space-y-6">          <Card>
            <CardHeader>
              <CardTitle>월별 항공사 매출 추이</CardTitle>
              <CardDescription>
                모든 항공사의 월별 매출액 변화를 함께 보여줍니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <LucideIcon name="Loader" className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Line
                  data={monthlyRevenueChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: ${formatNumber(context.raw as number)}원`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return `${(value as number) / 10000}만원`;
                          }
                        }
                      }
                    }
                  }}
                  height={100}
                />
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 gap-6">            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{selectedAirline} 누적 매출 추이</CardTitle>
                  <CardDescription>
                    {selectedAirline}의 월별 매출액과 누적 매출액을 보여줍니다.
                  </CardDescription>
                </div>
                {!loading && (
                  <div className="flex items-center">
                    <Select 
                      value={selectedAirline}
                      onValueChange={(value) => {
                        setSelectedAirline(value);
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="항공사 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {airlines.map((airline) => (
                          <SelectItem key={airline} value={airline}>{airline}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[200px] flex items-center justify-center">
                    <LucideIcon name="Loader" className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>날짜</TableHead>
                        <TableHead className="text-right">월 매출액</TableHead>
                        <TableHead className="text-right">누적 매출액</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyRevenueData.filter(item => item.AIRLINE === selectedAirline)
                        .map((item) => (
                          <TableRow key={`${item.AIRLINE}-${item.REVENUE_YEAR}-${item.REVENUE_MONTH}`}>
                            <TableCell className="font-medium">{item.REVENUE_YEAR}년 {item.REVENUE_MONTH}월</TableCell>
                            <TableCell className="text-right">{formatNumber(item.MONTHLY_REVENUE)}원</TableCell>
                            <TableCell className="text-right">{formatNumber(item.CUMULATIVE_REVENUE)}원</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
