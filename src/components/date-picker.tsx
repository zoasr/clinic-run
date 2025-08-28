import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
	selected,
	placeholder,
	...props
}: React.ComponentProps<typeof Calendar> & {
	selected: Date | undefined;
	placeholder?: string;
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					data-empty={!selected}
					className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
				>
					<CalendarIcon />
					{selected ? (
						format(selected, "PPP")
					) : (
						<span>{placeholder ?? "Pick a date"}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				{/* @ts-ignore */}
				<Calendar selected={selected} {...props} />
			</PopoverContent>
		</Popover>
	);
}
