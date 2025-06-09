import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

// 항공편 폼 스키마
const flightFormSchema = z.object({
  flightCode: z.string().min(2, { message: "항공편 코드를 입력해주세요." }),
  airline: z.string().min(1, { message: "항공사를 선택해주세요." }),
  departureAirport: z.string().min(1, { message: "출발 공항을 선택해주세요." }),
  departureCity: z.string().min(1, { message: "출발 도시를 입력해주세요." }),
  arrivalAirport: z.string().min(1, { message: "도착 공항을 선택해주세요." }),
  arrivalCity: z.string().min(1, { message: "도착 도시를 입력해주세요." }),
  date: z.string().min(1, { message: "날짜를 선택해주세요." }),
  departureTime: z.string().min(1, { message: "출발 시간을 선택해주세요." }),
  arrivalTime: z.string().min(1, { message: "도착 시간을 선택해주세요." }),
  economyPrice: z.coerce
    .number()
    .min(0, { message: "0 이상의 금액을 입력해주세요." }),
  businessPrice: z.coerce
    .number()
    .min(0, { message: "0 이상의 금액을 입력해주세요." }),
  economySeatsTotal: z.coerce
    .number()
    .min(0, { message: "0 이상의 좌석 수를 입력해주세요." }),
  businessSeatsTotal: z.coerce
    .number()
    .min(0, { message: "0 이상의 좌석 수를 입력해주세요." }),
  economySeatsAvailable: z.coerce
    .number()
    .min(0, { message: "0 이상의 좌석 수를 입력해주세요." }),
  businessSeatsAvailable: z.coerce
    .number()
    .min(0, { message: "0 이상의 좌석 수를 입력해주세요." }),
  status: z.enum(["scheduled", "delayed", "cancelled"], {
    required_error: "상태를 선택해주세요.",
  }),
});

export type FlightFormValues = z.infer<typeof flightFormSchema>;

interface FlightFormProps {
  defaultValues?: Partial<FlightFormValues>;
  onSubmit: (values: FlightFormValues) => void;
  onCancel?: () => void;
}

export default function FlightForm({
  defaultValues = {
    flightCode: "",
    airline: "",
    departureAirport: "",
    departureCity: "",
    arrivalAirport: "",
    arrivalCity: "",
    date: new Date().toISOString().split("T")[0],
    departureTime: "",
    arrivalTime: "",
    economyPrice: 0,
    businessPrice: 0,
    economySeatsTotal: 0,
    businessSeatsTotal: 0,
    economySeatsAvailable: 0,
    businessSeatsAvailable: 0,
    status: "scheduled",
  },
  onSubmit,
  onCancel,
}: FlightFormProps) {
  const form = useForm<FlightFormValues>({
    resolver: zodResolver(flightFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="flightCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>항공편 코드</FormLabel>
                <FormControl>
                  <Input placeholder="예: KE123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="airline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>항공사</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="항공사 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="대한항공">대한항공</SelectItem>
                    <SelectItem value="아시아나항공">아시아나항공</SelectItem>
                    <SelectItem value="제주항공">제주항공</SelectItem>
                    <SelectItem value="티웨이항공">티웨이항공</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departureAirport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출발 공항</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="출발 공항 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ICN">인천국제공항 (ICN)</SelectItem>
                    <SelectItem value="GMP">김포국제공항 (GMP)</SelectItem>
                    <SelectItem value="CJU">제주국제공항 (CJU)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departureCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출발 도시</FormLabel>
                <FormControl>
                  <Input placeholder="예: 서울" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="arrivalAirport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>도착 공항</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="도착 공항 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="NRT">나리타국제공항 (NRT)</SelectItem>
                    <SelectItem value="HND">하네다국제공항 (HND)</SelectItem>
                    <SelectItem value="KIX">간사이국제공항 (KIX)</SelectItem>
                    <SelectItem value="BKK">수완나품국제공항 (BKK)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="arrivalCity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>도착 도시</FormLabel>
                <FormControl>
                  <Input placeholder="예: 도쿄" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>날짜</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departureTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>출발 시간</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="arrivalTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>도착 시간</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="economyPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이코노미석 가격</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비즈니스석 가격</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="economySeatsTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이코노미석 총 좌석</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessSeatsTotal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비즈니스석 총 좌석</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="economySeatsAvailable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이코노미석 잔여석</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="businessSeatsAvailable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비즈니스석 잔여석</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>상태</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="scheduled">예정됨</SelectItem>
                    <SelectItem value="delayed">지연됨</SelectItem>
                    <SelectItem value="cancelled">취소됨</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
          )}
          <Button type="submit">저장</Button>
        </div>
      </form>
    </Form>
  );
}
