import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'oracle',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1521,
  username: process.env.DB_USERNAME || 'system',
  password: process.env.DB_PASSWORD || 'oracle',
  serviceName: process.env.DB_SERVICE_NAME || 'xe',
  // synchronize: process.env.DB_SYNC === 'true',
  // logging: process.env.DB_LOGGING === 'true',
  // entities: ['dist/**/*.entity{.ts,.js}'],
}));
