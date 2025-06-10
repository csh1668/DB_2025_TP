// 좌석 정보 인터페이스
export interface Seat {
  flightNo: string;
  departureDateTime: Date;
  seatClass: string;
  price: number;
  no_of_seats: number;
}
