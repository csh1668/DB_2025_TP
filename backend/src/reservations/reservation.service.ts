import { Injectable } from '@nestjs/common';
import * as oracledb from 'oracledb';
import { DatabaseService } from '../database/database.service';
import { Reservation } from './reservation.interface';

@Injectable()
export class ReservationService {
  constructor(private dbService: DatabaseService) {}

  async findAll(): Promise<Reservation[]> {
    const sql = `
      SELECT 
        RESERVATION_ID as "reservationId", 
        USER_ID as "userId", 
        FLIGHT_ID as "flightId", 
        RESERVATION_DATE as "reservationDate", 
        SEAT_NUMBER as "seatNumber", 
        STATUS as "status" 
      FROM RESERVATIONS
    `;
    return this.dbService.executeQuery<Reservation>(sql);
  }

  async findOne(id: number): Promise<Reservation | null> {
    const sql = `
      SELECT 
        RESERVATION_ID as "reservationId", 
        USER_ID as "userId", 
        FLIGHT_ID as "flightId", 
        RESERVATION_DATE as "reservationDate", 
        SEAT_NUMBER as "seatNumber", 
        STATUS as "status" 
      FROM RESERVATIONS 
      WHERE RESERVATION_ID = :1
    `;
    const reservations = await this.dbService.executeQuery<Reservation>(sql, [id]);
    return reservations.length > 0 ? reservations[0] : null;
  }

  async findByUserId(userId: number): Promise<Reservation[]> {
    const sql = `
      SELECT 
        RESERVATION_ID as "reservationId", 
        USER_ID as "userId", 
        FLIGHT_ID as "flightId", 
        RESERVATION_DATE as "reservationDate", 
        SEAT_NUMBER as "seatNumber", 
        STATUS as "status" 
      FROM RESERVATIONS 
      WHERE USER_ID = :1
    `;
    return this.dbService.executeQuery<Reservation>(sql, [userId]);
  }

  async create(reservation: Omit<Reservation, 'reservationId' | 'reservationDate'>): Promise<Reservation> {
    const sql = `
      INSERT INTO RESERVATIONS (
        USER_ID, 
        FLIGHT_ID, 
        SEAT_NUMBER, 
        STATUS
      ) VALUES (:1, :2, :3, :4)
      RETURNING RESERVATION_ID, RESERVATION_DATE INTO :5, :6
    `;

    let connection;
    try {
      connection = await oracledb.getConnection();
      const result = await connection.execute(
        sql,
        [
          reservation.userId,
          reservation.flightId,
          reservation.seatNumber,
          reservation.status || 'CONFIRMED',
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          { dir: oracledb.BIND_OUT, type: oracledb.DATE }
        ],
        { autoCommit: true }
      );
      
      const reservationId = result.outBinds[0][0];
      const reservationDate = result.outBinds[1][0];
      
      // 항공편의 가용 좌석 수를 감소시킨다
      await this.updateAvailableSeats(reservation.flightId, -1);
      
      return { 
        ...reservation, 
        reservationId, 
        reservationDate 
      } as Reservation;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (err) {
          console.error('연결 종료 오류:', err);
        }
      }
    }
  }

  async updateStatus(id: number, status: string): Promise<number> {
    const sql = 'UPDATE RESERVATIONS SET STATUS = :1 WHERE RESERVATION_ID = :2';
    return this.dbService.executeNonQuery(sql, [status, id]);
  }

  async delete(id: number): Promise<number> {
    // 예약 정보 조회
    const reservation = await this.findOne(id);
    if (!reservation) return 0;

    // 예약 삭제
    const sql = 'DELETE FROM RESERVATIONS WHERE RESERVATION_ID = :1';
    const result = await this.dbService.executeNonQuery(sql, [id]);
    
    if (result > 0) {
      // 항공편의 가용 좌석 수를 증가시킨다
      await this.updateAvailableSeats(reservation.flightId, 1);
    }
    
    return result;
  }

  private async updateAvailableSeats(flightId: number, change: number): Promise<void> {
    const sql = `
      UPDATE FLIGHTS 
      SET AVAILABLE_SEATS = AVAILABLE_SEATS + :1 
      WHERE FLIGHT_ID = :2 AND AVAILABLE_SEATS + :1 >= 0
    `;
    await this.dbService.executeNonQuery(sql, [change, flightId]);
  }
}
