// 예약 인터페이스 정의
export interface Reservation {
  reservationId: number;
  userId: number;
  flightId: number;
  reservationDate: Date;
  seatNumber: string;
  status: string;
}
