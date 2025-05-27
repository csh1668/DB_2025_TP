import { useState } from "react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import LucideIcon from "../icons/lucideIcon";

interface DateSelectorPopoverProps {
    date?: Date,
    onDateSelect?: (date: Date) => void,
    placeHolder?: string;
}

export default function DateSelectorPopover({
    date,
    onDateSelect,
    placeHolder = "날짜 선택",
}: DateSelectorPopoverProps) {
    const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={`w-full justify-start text-left ${!date ? "text-muted-foreground" : ""} font-bold cursor-pointer`}
                >
                    <LucideIcon name="Calendar" className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ko }) + " (" + format(date, "EEE", { locale: ko }) + ")" : placeHolder}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                        if (selectedDate) {
                            onDateSelect?.(selectedDate);
                            setOpen(false);
                        }
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    )
}