"use client";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TimePicker({
  time,
  setTime,
  className,
}: {
  time: string | undefined;
  setTime: (time: string) => void;
  className: string;
}) {
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = ["00", "15", "30", "45"];

  const [hour, minute] = time ? time.split(":") : ["", ""];

  const handleHourChange = (value: string) => {
    setTime(`${value}:${minute || "00"}`);
  };

  const handleMinuteChange = (value: string) => {
    setTime(`${hour || "00"}:${value}`);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !time && "text-muted-foreground"
            )}
          >
            <Clock className="mr-2 h-4 w-4" />
            {time ? time : <span>Choisir une heure</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex gap-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Heure</p>
              <Select value={hour} onValueChange={handleHourChange}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center pt-8">:</div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Minute</p>
              <Select value={minute} onValueChange={handleMinuteChange}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {minutes.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
