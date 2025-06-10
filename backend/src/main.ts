import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 전역 유효성 검증 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO에 정의되지 않은 속성은 제거
    forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있는 경우 요청을 거부
    transform: true, // 타입 변환 활성화
  }));  // CORS 설정
  app.enableCors({
    // origin: 'http://localhost:5173', // Vite 기본 포트
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // 자격 증명(쿠키, 인증 헤더 등) 허용
  });

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('항공권 예약 시스템 API')
    .setDescription('항공권 예약 시스템의 REST API 문서입니다')
    .setVersion('1.0')
    .addTag('airplanes', '항공편 관련 API')
    .addTag('airports', '공항 정보 관련 API')
    .addTag('seats', '좌석 관련 API')
    .addTag('reservations', '예약 관련 API')
    .addTag('cancellations', '예약 취소 관련 API')
    .addTag('auth', '인증 관련 API')
    .addTag('users', '사용자 관리 API')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3000);
  logger.log(`애플리케이션이 http://localhost:3000 에서 실행 중입니다.`);
  logger.log(`Swagger API 문서는 http://localhost:3000/api 에서 확인할 수 있습니다.`);
}
bootstrap();
