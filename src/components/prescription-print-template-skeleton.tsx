import { Skeleton } from "@/components/ui/skeleton";

export function PrescriptionPrintTemplateSkeleton() {
	return (
		<div className="prescription-print-template bg-white text-black print-only">
			{/* Header */}
			<div className="border-b-2 border-gray-800 pb-6 mb-8">
				<div className="flex justify-between items-start">
					<div className="flex-1">
						<Skeleton className="h-10 w-48 mb-2" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-20" />
						</div>
					</div>
					<div className="text-right">
						<Skeleton className="h-8 w-32 mb-2" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-40" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-36" />
						</div>
					</div>
				</div>
			</div>

			{/* Patient and Doctor Information */}
			<div className="grid grid-cols-2 gap-8 mb-8">
				<div>
					<Skeleton className="h-6 w-40 mb-4" />
					<div className="bg-gray-50 p-4 rounded">
						<Skeleton className="h-6 w-48 mb-1" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-36" />
						</div>
					</div>
				</div>
				<div>
					<Skeleton className="h-6 w-40 mb-4" />
					<div className="bg-gray-50 p-4 rounded">
						<Skeleton className="h-6 w-48 mb-1" />
						<div className="space-y-1">
							<Skeleton className="h-4 w-20" />
						</div>
					</div>
				</div>
			</div>

			{/* Medication Details */}
			<div className="mb-8">
				<Skeleton className="h-6 w-48 mb-4" />
				<div className="border border-gray-300 rounded-lg overflow-hidden">
					<div className="bg-gray-100 px-4 py-3 border-b border-gray-300">
						<Skeleton className="h-6 w-40" />
					</div>
					<div className="p-4">
						<div className="grid grid-cols-2 gap-6">
							<div className="space-y-3">
								<div>
									<Skeleton className="h-4 w-16 mb-1" />
									<Skeleton className="h-5 w-24" />
								</div>
								<div>
									<Skeleton className="h-4 w-12 mb-1" />
									<Skeleton className="h-5 w-20" />
								</div>
								<div>
									<Skeleton className="h-4 w-16 mb-1" />
									<Skeleton className="h-5 w-28" />
								</div>
							</div>
							<div className="space-y-3">
								<div>
									<Skeleton className="h-4 w-20 mb-1" />
									<Skeleton className="h-5 w-32" />
								</div>
								<div>
									<Skeleton className="h-4 w-16 mb-1" />
									<Skeleton className="h-5 w-24" />
								</div>
								<div>
									<Skeleton className="h-4 w-12 mb-1" />
									<Skeleton className="h-5 w-8" />
								</div>
							</div>
						</div>
						<div className="mt-6 pt-4 border-t border-gray-200">
							<Skeleton className="h-4 w-20 mb-2" />
							<div className="p-3 bg-gray-50 rounded-md">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Prescription Timeline */}
			<div className="mb-8">
				<Skeleton className="h-6 w-40 mb-4" />
				<div className="grid grid-cols-2 gap-6">
					<div className="bg-gray-50 p-4 rounded">
						<Skeleton className="h-4 w-28 mb-1" />
						<Skeleton className="h-5 w-48" />
					</div>
					<div className="bg-gray-50 p-4 rounded">
						<Skeleton className="h-4 w-24 mb-1" />
						<Skeleton className="h-5 w-48" />
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="border-t border-gray-300 pt-6 text-center">
				<Skeleton className="h-4 w-full mb-2" />
				<Skeleton className="h-4 w-3/4 mx-auto" />
				<Skeleton className="h-3 w-1/2 mx-auto mt-4" />
			</div>
		</div>
	);
}
