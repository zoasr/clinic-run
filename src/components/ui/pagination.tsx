import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
	showPages?: number;
	className?: string;
}

export function Pagination({
	currentPage,
	totalPages,
	onPageChange,
	showPages = 5,
	className,
}: PaginationProps) {
	if (totalPages <= 1) return null;

	const getVisiblePages = () => {
		const delta = Math.floor(showPages / 2);
		let start = Math.max(1, currentPage - delta);
		const end = Math.min(totalPages, start + showPages - 1);

		if (end - start + 1 < showPages) {
			start = Math.max(1, end - showPages + 1);
		}

		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	};

	const visiblePages = getVisiblePages();
	const showStartEllipsis = visiblePages[0] > 2;
	const showEndEllipsis =
		visiblePages[visiblePages.length - 1] < totalPages - 1;

	return (
		<div
			className={cn("flex items-center justify-center space-x-1", className)}
		>
			{/* Previous Button */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage <= 1}
				className="flex items-center gap-1"
			>
				<ChevronLeft className="h-4 w-4" />
				Previous
			</Button>

			{/* First Page */}
			{visiblePages[0] > 1 && (
				<Button
					variant={currentPage === 1 ? "default" : "outline"}
					size="sm"
					onClick={() => onPageChange(1)}
					className="w-10"
				>
					1
				</Button>
			)}

			{/* Start Ellipsis */}
			{showStartEllipsis && (
				<div className="flex items-center px-2">
					<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
				</div>
			)}

			{/* Page Numbers */}
			{visiblePages.map((page) => (
				<Button
					key={page}
					variant={currentPage === page ? "default" : "outline"}
					size="sm"
					onClick={() => onPageChange(page)}
					className="w-10"
				>
					{page}
				</Button>
			))}

			{/* End Ellipsis */}
			{showEndEllipsis && (
				<div className="flex items-center px-2">
					<MoreHorizontal className="h-4 w-4 text-muted-foreground" />
				</div>
			)}

			{/* Last Page */}
			{visiblePages[visiblePages.length - 1] < totalPages && (
				<Button
					variant={currentPage === totalPages ? "default" : "outline"}
					size="sm"
					onClick={() => onPageChange(totalPages)}
					className="w-10"
				>
					{totalPages}
				</Button>
			)}

			{/* Next Button */}
			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage >= totalPages}
				className="flex items-center gap-1"
			>
				Next
				<ChevronRight className="h-4 w-4" />
			</Button>
		</div>
	);
}

interface PaginationInfoProps {
	currentPage: number;
	totalPages: number;
	totalItems: number;
	itemsPerPage: number;
	className?: string;
}

export function PaginationInfo({
	currentPage,
	totalPages,
	totalItems,
	itemsPerPage,
	className,
}: PaginationInfoProps) {
	const startItem = (currentPage - 1) * itemsPerPage + 1;
	const endItem = Math.min(currentPage * itemsPerPage, totalItems);

	return (
		<div className={cn("text-sm text-muted-foreground", className)}>
			Showing {startItem} to {endItem} of {totalItems} patients
		</div>
	);
}
