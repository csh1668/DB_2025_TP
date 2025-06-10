import { DatabaseModule } from "../database/database.module";
import { AirportService } from "./airport.service";
import { AirportController } from "./airport.controller";
import { Module } from "@nestjs/common";

@Module({
    imports: [DatabaseModule],
    providers: [AirportService],
    controllers: [AirportController],
    exports: [AirportService],
})
export class AirportModule {}