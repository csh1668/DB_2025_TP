import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class AirportService {
  private logger = new Logger(AirportService.name);

  private airportsByCountry: Record<string, string[]> = {
    "대한민국": [
        "인천 (ICN)",
        "김포 (GMP)",
        "김해 (PUS)",
        "제주 (CJU)",
    ],
    "일본": [
        "도쿄(나리타) (NRT)",
        "오사카 (KIX)",
        "후쿠오카 (FUK)",
        "삿포로 (CTS)"
    ],
    "중국": [
        "베이징 (PEK)",
        "상하이 (PVG)",
    ],
    "미국": [
        "로스앤젤레스 (LAX)",
        "뉴욕 (JFK)",
        "시카고 (ORD)",
        "샌프란시스코 (SFO)"
    ],
    "유럽": [
        "런던 (LHR)",
        "파리 (CDG)",
        "프랑크푸르트 (FRA)",
        "암스테르담 (AMS)"
    ],
    "동남아시아": [
        "방콕 (BKK)",
        "싱가포르 (SIN)",
        "쿠알라룸푸르 (KUL)",
        "발리 (DPS)"
    ],
  };
  private airportByCode: Record<string, string> = {};

  constructor() {
    // Initialize airportByCode for quick lookup
    for (const [country, airports] of Object.entries(this.airportsByCountry)) {
      for (const airport of airports) {
        const t = airport.split(' ');
        if (t.length >= 2) {
          const code = t[t.length - 1].replace(/[()]/g, '').toUpperCase();
          this.airportByCode[code] = airport;
        }
      }
    }
  }

  getAllAirports(): string[] {
    return Object.entries(this.airportsByCountry)
        .flatMap(([country, airports]) => 
            airports.map(airport => `${airport} (${country})`)
        );
  }

  getAirportsByCountry(country: string): string[] {
    const airports = this.airportsByCountry[country];
    if (!airports) {
      return [];
    }
    return airports.map(airport => `${airport} (${country})`);
  }

  getCountries(): string[] {
    return Object.keys(this.airportsByCountry);
  }

  getAirportByCode(code: string): string | undefined {
    return this.airportByCode[code.toUpperCase()];
  }
}