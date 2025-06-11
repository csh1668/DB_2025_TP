import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // 트랜스포터 생성
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER || '',
          pass: process.env.EMAIL_PASSWORD || '',
        },
      });
      
    } catch (error) {
      this.logger.error('이메일 서비스 초기화 실패', error);
    }
  }

  /**
   * 예약 확인 이메일을 전송합니다.
   */
  async sendReservationConfirmation(
    to: string,
    reservationData: {
      name: string;
      flightNo: string;
      departureDateTime: string;
      seatClass: string;
      payment: number;
      departureAirport?: string;
      arrivalAirport?: string;
      airline?: string;
    }
  ): Promise<boolean> {
    try {
      const { 
        name, 
        flightNo, 
        departureDateTime, 
        seatClass, 
        payment,
        departureAirport,
        arrivalAirport,
        airline
      } = reservationData;

      // 항공편 출발 시간
      const departureDate = new Date(departureDateTime);
      const formattedDate = departureDate.toLocaleDateString('ko-KR', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // 이메일 내용 작성
      const mailOptions = {
        from: '"하늘길 항공 예약 시스템" <reservation@skyway.com>',
        to,
        subject: '✈️ [하늘길] 항공권 예약이 완료되었습니다',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
              <h1 style="margin: 0;">항공권 예약이 완료되었습니다</h1>
            </div>
            
            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 5px 5px;">
              <p style="font-size: 16px;"><strong>${name}</strong>님, 항공권 예약이 완료되었습니다.</p>
              
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h2 style="margin-top: 0; color: #3b82f6;">예약 정보</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; width: 40%;"><strong>항공편:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${airline ? airline + ' ' : ''}${flightNo}</td>
                  </tr>
                  ${departureAirport && arrivalAirport ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>여정:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${departureAirport} → ${arrivalAirport}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>출발:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>좌석 등급:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${seatClass === 'Business' ? '비즈니스석' : '이코노미석'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>결제 금액:</strong></td>
                    <td style="padding: 8px 0;">${payment.toLocaleString()}원</td>
                  </tr>
                </table>
              </div>
              
              <p>예약하신 항공편의 상세 정보는 '내 항공권' 페이지에서 확인하실 수 있습니다.</p>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="http://localhost:5173/user" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">내 항공권 보기</a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                문의사항이 있으시면 고객센터(1588-xxxx)로 연락 주시기 바랍니다.<br>
                감사합니다.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
              © 2025 하늘길 항공. All rights reserved.
            </div>
          </div>
        `,
      };

      // 이메일 전송
      const info = await this.transporter.sendMail(mailOptions);
      
      // 테스트 이메일의 경우 웹에서 이메일을 확인할 수 있는 URL을 제공
      this.logger.log(`이메일 전송 완료: ${info.messageId}`);
      this.logger.log(`이메일 미리보기: ${nodemailer.getTestMessageUrl(info)}`);
      
      return true;
    } catch (error) {
      this.logger.error(`이메일 전송 실패: ${error.message}`, error.stack);
      return false;
    }
  }
}
