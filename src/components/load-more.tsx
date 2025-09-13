import { Button } from "./ui/button";

export default function LoadMore({
	label = "Results",
	results,
	hasNextPage,
	fetchNextPage,
	isFetchingNextPage,
}: {
	label?: string | "Results";
	results: any[];
	hasNextPage: boolean;
	fetchNextPage: () => void;
	isFetchingNextPage: boolean;
}) {
	return (
		<>
			{results.length > 0 && (
				<div className="flex flex-col items-center gap-4 mt-8">
					<div className="text-sm text-muted-foreground">
						Showing {results.length} {label}
						{!hasNextPage && " (all loaded)"}
					</div>
					{hasNextPage && (
						<Button
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
							className="min-w-[120px]"
							size="lg"
						>
							{isFetchingNextPage ? "Loading..." : `Load more ${label}`}
						</Button>
					)}
				</div>
			)}
		</>
	);
}
