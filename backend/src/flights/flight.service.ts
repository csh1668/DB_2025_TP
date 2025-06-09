import { Injectable } from '@nestjs/common';
import * as oracledb from 'oracledb';
import { DatabaseService } from '../database/database.service';
import { Flight } from './flight.interface';

@Injectable()
export class FlightService {
  constructor(private dbService: DatabaseService) {}

  async findAll(): Promise<Flight[]> {
    const sql = `
      SELECT 
        FLIGHT_ID as "flightId", 
        FLIGHT_NUMBER as "flightNumber", 
        DEPARTURE_AIRPORT as "departureAirport", 
        ARRIVAL_AIRPORT as "arrivalAirport", 
        DEPARTURE_TIME as "departureTime", 
        ARRIVAL_TIME as "arrivalTime", 
        PRICE as "price", 
        AVAILABLE_SEATS as "availableSeats" 
      FROM FLIGHTS
    `;
    return this.dbService.executeQuery<Flight>(sql);
  }

  async findOne(id: number): Promise<Flight | null> {
    const sql = `
      SELECT 
        FLIGHT_ID as "flightId", 
        FLIGHT_NUMBER as "flightNumber", 
        DEPARTURE_AIRPORT as "departureAirport", 
        ARRIVAL_AIRPORT as "arrivalAirport", 
        DEPARTURE_TIME as "departureTime", 
        ARRIVAL_TIME as "arrivalTime", 
        PRICE as "price", 
        AVAILABLE_SEATS as "availableSeats" 
      FROM FLIGHTS 
      WHERE FLIGHT_ID = :1
    `;
    const flights = await this.dbService.executeQuery<Flight>(sql, [id]);
    return flights.length > 0 ? flights[0] : null;
  }

  async search(params: {
    departureAirport?: string;
    arrivalAirport?: string;
    departureDate?: Date;
  }): Promise<Flight[]> {
    let sql = `
      SELECT 
        FLIGHT_ID as "flightId", 
        FLIGHT_NUMBER as "flightNumber", 
        DEPARTURE_AIRPORT as "departureAirport", 
        ARRIVAL_AIRPORT as "arrivalAirport", 
        DEPARTURE_TIME as "departureTime", 
        ARRIVAL_TIME as "arrivalTime", 
        PRICE as "price", 
        AVAILABLE_SEATS as "availableSeats" 
      FROM FLIGHTS 
      WHERE 1=1
    `;
    const queryParams = [];

    if (params.departureAirport) {
      sql += ` AND DEPARTURE_AIRPORT = :${queryParams.length + 1}`;
      queryParams.push(params.departureAirport);
    }

    if (params.arrivalAirport) {
      sql += ` AND ARRIVAL_AIRPORT = :${queryParams.length + 1}`;
      queryParams.push(params.arrivalAirport);
    }

    if (params.departureDate) {
      sql += ` AND TRUNC(DEPARTURE_TIME) = TRUNC(:${queryParams.length + 1})`;
      queryParams.push(params.departureDate);
    }

    sql += ' ORDER BY DEPARTURE_TIME ASC';

    return this.dbService.executeQuery<Flight>(sql, queryParams);
  }

  async create(flight: Omit<Flight, 'flightId'>): Promise<Flight> {
    const sql = `
      INSERT INTO FLIGHTS (
        FLIGHT_NUMBER, 
        DEPARTURE_AIRPORT, 
        ARRIVAL_AIRPORT, 
        DEPARTURE_TIME, 
        ARRIVAL_TIME, 
        PRICE, 
        AVAILABLE_SEATS
      ) VALUES (:1, :2, :3, :4, :5, :6, :7)
      RETURNING FLIGHT_ID INTO :8
    `;    let connection;
    try {
      connection = await oracledb.getConnection();
      const result = await connection.execute(
        sql,
        [
          flight.flightNumber,
          flight.departureAirport,
          flight.arrivalAirport,
          flight.departureTime,
          flight.arrivalTime,
          flight.price,
          flight.availableSeats,
          { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        ],
        { autoCommit: true }
      );
      
      const flightId = result.outBinds[0][0];
      return { ...flight, flightId } as Flight;
    } catch (err) {
      console.error('항공편 생성 오류:', err);
      throw err;
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

  async update(id: number, flight: Partial<Flight>): Promise<number> {
    let sql = 'UPDATE FLIGHTS SET ';
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    if (flight.flightNumber !== undefined) {
      updateFields.push(`FLIGHT_NUMBER = :${paramIndex}`);
      params.push(flight.flightNumber);
      paramIndex++;
    }

    if (flight.departureAirport !== undefined) {
      updateFields.push(`DEPARTURE_AIRPORT = :${paramIndex}`);
      params.push(flight.departureAirport);
      paramIndex++;
    }

    if (flight.arrivalAirport !== undefined) {
      updateFields.push(`ARRIVAL_AIRPORT = :${paramIndex}`);
      params.push(flight.arrivalAirport);
      paramIndex++;
    }

    if (flight.departureTime !== undefined) {
      updateFields.push(`DEPARTURE_TIME = :${paramIndex}`);
      params.push(flight.departureTime);
      paramIndex++;
    }

    if (flight.arrivalTime !== undefined) {
      updateFields.push(`ARRIVAL_TIME = :${paramIndex}`);
      params.push(flight.arrivalTime);
      paramIndex++;
    }

    if (flight.price !== undefined) {
      updateFields.push(`PRICE = :${paramIndex}`);
      params.push(flight.price);
      paramIndex++;
    }

    if (flight.availableSeats !== undefined) {
      updateFields.push(`AVAILABLE_SEATS = :${paramIndex}`);
      params.push(flight.availableSeats);
      paramIndex++;
    }

    sql += updateFields.join(', ');
    sql += ` WHERE FLIGHT_ID = :${paramIndex}`;
    params.push(id);

    return this.dbService.executeNonQuery(sql, params);
  }

  async delete(id: number): Promise<number> {
    const sql = 'DELETE FROM FLIGHTS WHERE FLIGHT_ID = :1';
    return this.dbService.executeNonQuery(sql, [id]);
  }
}
