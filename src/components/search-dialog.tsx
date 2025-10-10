import { Search, X } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

interface SearchDialogProps<T> {
	title: string;
	description: string;
	placeholder: string;
	items: T[];
	renderItem: (
		item: T,
		onSelect: () => void,
		isSelected?: boolean,
	) => React.ReactNode;
	onItemSelect: (item: T) => void;
	selectedItem?: T;
	getItemKey: (item: T) => string;
	getItemDisplay: (item: T) => ReactNode;
	isLoading?: boolean;
	emptyMessage?: string;
	searchValue: string;
	onSearchChange: (value: string) => void;
	trigger?: React.ReactNode;
}

export function SearchDialog<T>({
	title,
	description,
	placeholder,
	items,
	renderItem,
	onItemSelect,
	selectedItem,
	getItemKey,
	getItemDisplay,
	isLoading = false,
	emptyMessage = "No items found",
	searchValue,
	onSearchChange,
	trigger,
}: SearchDialogProps<T>) {
	const [open, setOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const inputRef = useRef<HTMLInputElement>(null);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset selected index when dialog opens/closes or items change
	useEffect(() => {
		setSelectedIndex(-1);
	}, [open, items]);

	// Focus input when dialog opens
	useEffect(() => {
		if (open && inputRef.current) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [open]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!items.length) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
				break;
			case "Enter":
				e.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < items.length) {
					handleSelect(items[selectedIndex]);
				}
				break;
			case "Escape":
				setOpen(false);
				break;
		}
	};

	const handleSelect = (item: T) => {
		onItemSelect(item);
		setOpen(false);
	};

	const clearSearch = () => {
		onSearchChange("");
		setSelectedIndex(-1);
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	const defaultTrigger = selectedItem ? (
		<Button
			type="button"
			variant="outline"
			className="justify-start w-full my-2"
		>
			<span className="truncate">{getItemDisplay(selectedItem)}</span>
		</Button>
	) : (
		<Button type="button" className="my-2">
			Select {title.toLowerCase().replace("search ", "")}
		</Button>
	);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							ref={inputRef}
							placeholder={placeholder}
							value={searchValue}
							onChange={(e) => onSearchChange(e.target.value)}
							onKeyDown={handleKeyDown}
							className="pl-9 pr-9"
						/>
						{searchValue && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-muted"
								onClick={clearSearch}
							>
								<X className="h-3 w-3" />
							</Button>
						)}
					</div>
					<ScrollArea
						ref={scrollAreaRef}
						className="h-[300px] w-full rounded-md border"
					>
						<div className="p-4 space-y-2 h-full">
							{isLoading ? (
								<div className="space-y-3">
									{Array.from({ length: 5 }).map((_, i) => (
										<Skeleton key={i} className="h-12 w-full" />
									))}
								</div>
							) : items.length > 0 ? (
								items.map((item, index) => (
									<div key={getItemKey(item)}>
										{renderItem(
											item,
											() => handleSelect(item),
											index === selectedIndex,
										)}
									</div>
								))
							) : searchValue ? (
								<div className="flex flex-col items-center justify-center py-8 text-center">
									<Search className="h-8 w-8 text-muted-foreground mb-2" />
									<p className="text-sm text-muted-foreground">
										{emptyMessage}
									</p>
								</div>
							) : (
								<div className="flex flex-col items-center justify-center py-8 text-center">
									<Search className="h-8 w-8 text-muted-foreground mb-2" />
									<p className="text-sm text-muted-foreground">
										Start typing to search...
									</p>
								</div>
							)}
						</div>
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
}
