import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import LucideIcon from "../icons/lucideIcon";
import AirportSelectorPopover, { type Airport } from "./airportSelectorPopover";
import DateSelectorPopover from "./dateSelectorPopover";

interface FlightSearchFormProps {
  defaultValues?: {
    departureAirport?: string;
    arrivalAirport?: string;
    date?: Date;
    passengers?: number;
  };
}

export default function FlightSearchForm({ defaultValues }: FlightSearchFormProps) {
  const [date, setDate] = useState<Date | undefined>(defaultValues?.date);
//   const [returnDate, setReturnDate] = useState<Date>();
  const [tripType, setTripType] = useState("oneway");
  const [departureAirport, setDepartureAirport] = useState<Airport | undefined>(
    defaultValues?.departureAirport 
      ? { id: defaultValues.departureAirport, code: defaultValues.departureAirport, name: defaultValues.departureAirport, country: '' } 
      : undefined
  );
  const [arrivalAirport, setArrivalAirport] = useState<Airport | undefined>(
    defaultValues?.arrivalAirport 
      ? { id: defaultValues.arrivalAirport, code: defaultValues.arrivalAirport, name: defaultValues.arrivalAirport, country: '' } 
      : undefined
  );
  const [passengers, setPassengers] = useState<number>(defaultValues?.passengers || 1);

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <Tabs defaultValue="oneway" value={tripType} onValueChange={setTripType}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="roundtrip" disabled>왕복</TabsTrigger>
            <TabsTrigger value="oneway" className="font-bold">편도</TabsTrigger>
            <TabsTrigger value="multi-city" disabled>다구간</TabsTrigger>
          </TabsList>
          
          <TabsContent value="roundtrip" className="space-y-4">
            Not Implemented
          </TabsContent>

          <TabsContent value="oneway" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <AirportSelectorPopover
                placeholder="출발지"
                selectedAirport={departureAirport}
                onAirportSelect={setDepartureAirport}
              />
              <AirportSelectorPopover
                placeholder="도착지"
                selectedAirport={arrivalAirport}
                onAirportSelect={setArrivalAirport}
                excludeAirport={departureAirport}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 font-bold">
              <DateSelectorPopover
                date={date}
                onDateSelect={setDate}
                placeHolder="출발 날짜"
              />              <div>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-bold"
                >
                  <LucideIcon name="Users" className="mr-2 h-4 w-4" />
                  성인 {passengers}인
                </Button>
              </div>
            </div>
            <Button className="w-full font-bold">항공편 검색</Button>
          </TabsContent>

          <TabsContent value="multi-city" className="space-y-4">
            Not Implemented
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}