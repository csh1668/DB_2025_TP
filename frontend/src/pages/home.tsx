import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import FlightSearchForm from "@/components/forms/flightSearchForm";

export default function HomePage() {

  const destinations = [
    { name: "도쿄 (NRT)", imgUrl: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=1000" },
    { name: "뉴욕 (JFK)", imgUrl: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1000" },
    { name: "런던 (LHR)", imgUrl: "https://images.unsplash.com/photo-1486299267070-83823f5448dd?q=80&w=1000" }
  ];

  return (
    <div className="flex flex-col min-h-svh">      {/* Hero Section */}
      <section className="w-full py-4 md:py-2 lg:py-8">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">

          {/* Search Form */}
          <section className="w-full py-4 md:py-2 lg:py-8">
            <div className="container px-4 md:px-6 mx-auto max-w-7xl">
              <div className="max-w-3xl mx-auto">
                <FlightSearchForm />
              </div>
            </div>
          </section>
        </div>
      </section>      {/* Popular Destinations */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="flex flex-col items-center text-center space-y-4 mb-8 md:mb-12">
            <h2 className="text-3xl font-bold">인기 여행지</h2>
            <p className="text-gray-600">전 세계 인기 여행지로 떠나는 여행</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {destinations.map((dest, index) => (
              <Link to="/flights" key={index} className="group">
                <div className="relative overflow-hidden rounded-lg">
                  <img
                    src={dest.imgUrl}
                    alt={dest.name}
                    className="w-full h-64 object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-lg font-semibold text-white">{dest.name}</h3>
                    <p className="text-sm text-white/80">지금 검색하기</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button variant="outline" asChild>
              <Link to="/flights">모든 여행지 보기</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
