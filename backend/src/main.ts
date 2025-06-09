import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 전역 유효성 검증 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO에 정의되지 않은 속성은 제거
    forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있는 경우 요청을 거부
    transform: true, // 타입 변환 활성화
  }));

  // CORS 설정
  app.enableCors({
    // origin: 'http://localhost:5173', // Vite 기본 포트
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3000);
  logger.log(`애플리케이션이 http://localhost:3000 에서 실행 중입니다.`);
}
bootstrap();
