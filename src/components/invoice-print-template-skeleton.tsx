import { Skeleton } from "@/components/ui/skeleton";

export function InvoicePrintTemplateSkeleton() {
	return (
		<div className="invoice-print-template bg-white text-black print-only">
			{/* Header */}
			<div className="border-b-2 border-gray-800 pb-6 mb-8">
				<div className="flex justify-between items-start">
					<div className="flex-1">
						<Skeleton className="h-10 w-32 mb-2" />
						<div className="space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-4 w-36" />
						</div>
					</div>

					<div className="text-right">
						<Skeleton className="h-8 w-32 mb-2 ml-auto" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-48 ml-auto" />
							<Skeleton className="h-4 w-40 ml-auto" />
							<Skeleton className="h-4 w-44 ml-auto" />
						</div>
					</div>
				</div>
			</div>

			{/* Bill To Section */}
			<div className="mb-8">
				<Skeleton className="h-6 w-20 mb-4" />
				<div className="bg-gray-50 p-4 rounded">
					<Skeleton className="h-6 w-48 mb-2" />
					<div className="space-y-1">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-36" />
						<Skeleton className="h-4 w-40" />
					</div>
				</div>
			</div>

			{/* Invoice Items Table */}
			<div className="mb-8">
				<table className="w-full border-collapse border border-gray-300">
					<thead>
						<tr className="bg-gray-100">
							<th className="border border-gray-300 px-4 py-3 text-left">
								<Skeleton className="h-5 w-24" />
							</th>
							<th className="border border-gray-300 px-4 py-3 text-center">
								<Skeleton className="h-5 w-16 mx-auto" />
							</th>
							<th className="border border-gray-300 px-4 py-3 text-right">
								<Skeleton className="h-5 w-20 ml-auto" />
							</th>
							<th className="border border-gray-300 px-4 py-3 text-right">
								<Skeleton className="h-5 w-16 ml-auto" />
							</th>
						</tr>
					</thead>
					<tbody>
						{/* Render 3-4 skeleton rows */}
						{Array.from({ length: 4 }).map((_, index) => (
							<tr key={index} className="border-b border-gray-200">
								<td className="border border-gray-300 px-4 py-3">
									<Skeleton className="h-4 w-full max-w-64" />
								</td>
								<td className="border border-gray-300 px-4 py-3 text-center">
									<Skeleton className="h-4 w-8 mx-auto" />
								</td>
								<td className="border border-gray-300 px-4 py-3 text-right">
									<Skeleton className="h-4 w-16 ml-auto" />
								</td>
								<td className="border border-gray-300 px-4 py-3 text-right">
									<Skeleton className="h-4 w-16 ml-auto" />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Summary Section */}
			<div className="flex justify-end mb-8">
				<div className="w-64">
					<div className="border-t-2 border-gray-800 pt-4 space-y-3">
						<div className="flex justify-between">
							<Skeleton className="h-4 w-16" />
							<Skeleton className="h-4 w-20" />
						</div>
						<div className="flex justify-between">
							<Skeleton className="h-4 w-8" />
							<Skeleton className="h-4 w-16" />
						</div>
						<div className="flex justify-between pt-2 border-t border-gray-300">
							<Skeleton className="h-5 w-12" />
							<Skeleton className="h-5 w-24" />
						</div>
					</div>
				</div>
			</div>

			{/* Payment Information */}
			<div className="grid grid-cols-2 gap-8 mb-8">
				<div>
					<Skeleton className="h-5 w-28 mb-3" />
					<div className="space-y-2">
						<div className="flex justify-between">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
						</div>
						<div className="flex justify-between">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-18" />
						</div>
						<div className="flex justify-between">
							<Skeleton className="h-4 w-20" />
							<Skeleton className="h-4 w-22" />
						</div>
						<div className="flex justify-between pt-2 border-t border-gray-300">
							<Skeleton className="h-4 w-12" />
							<Skeleton className="h-4 w-16" />
						</div>
					</div>
				</div>

				<div>
					<Skeleton className="h-5 w-24 mb-3" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-5/6" />
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="border-t border-gray-300 pt-6 text-center">
				<Skeleton className="h-4 w-3/4 mx-auto mb-2" />
				<Skeleton className="h-4 w-2/3 mx-auto" />
				<Skeleton className="h-3 w-1/2 mx-auto mt-4" />
			</div>
		</div>
	);
}
