// 항공편 인터페이스 정의
export interface Flight {
  flightId: number;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: Date;
  arrivalTime: Date;
  price: number;
  availableSeats: number;
}
