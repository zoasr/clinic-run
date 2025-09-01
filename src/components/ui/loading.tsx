import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Activity, Heart, Stethoscope } from "lucide-react";
import { Card, CardContent } from "./card";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
	variant?: "spinner" | "pulse" | "skeleton" | "dots" | "medical" | "cards";
	size?: "sm" | "md" | "lg" | "xl";
	text?: string;
	fullScreen?: boolean;
	overlay?: boolean;
}

const LoadingSpinner = ({
	size = "md",
	className,
}: {
	size?: LoadingProps["size"];
	className?: string;
}) => {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-6 w-6",
		lg: "h-8 w-8",
		xl: "h-12 w-12",
	};

	return (
		<Loader2
			className={cn(
				"animate-spin text-primary",
				sizeClasses[size],
				className
			)}
		/>
	);
};

const LoadingPulse = ({
	size = "md",
	className,
}: {
	size?: LoadingProps["size"];
	className?: string;
}) => {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-6 w-6",
		lg: "h-8 w-8",
		xl: "h-12 w-12",
	};

	return (
		<div className={cn("relative", sizeClasses[size], className)}>
			<div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
			<div className="relative rounded-full bg-primary" />
		</div>
	);
};

const LoadingDots = ({
	size = "md",
	className,
}: {
	size?: LoadingProps["size"];
	className?: string;
}) => {
	const sizeClasses = {
		sm: "h-1 w-1",
		md: "h-2 w-2",
		lg: "h-3 w-3",
		xl: "h-4 w-4",
	};

	return (
		<div className={cn("flex space-x-1", className)}>
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					className={cn(
						"rounded-full bg-primary animate-bounce",
						sizeClasses[size]
					)}
					style={{ animationDelay: `${i * 0.1}s` }}
				/>
			))}
		</div>
	);
};

const LoadingMedical = ({
	size = "md",
	className,
}: {
	size?: LoadingProps["size"];
	className?: string;
}) => {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-6 w-6",
		lg: "h-8 w-8",
		xl: "h-12 w-12",
	};

	return (
		<div className={cn("relative", className)}>
			<Heart
				className={cn("text-red-500 animate-pulse", sizeClasses[size])}
			/>
			<Stethoscope
				className={cn(
					"absolute -top-1 -right-1 text-blue-500 animate-bounce",
					sizeClasses.sm
				)}
			/>
		</div>
	);
};

const LoadingSkeleton = ({
	className,
	children,
}: {
	className?: string;
	children?: React.ReactNode;
}) => {
	if (children) {
		return <div className={cn("space-y-3", className)}>{children}</div>;
	}

	return (
		<div className={cn("space-y-3", className)}>
			<Skeleton className="h-4 w-3/4" />
			<Skeleton className="h-4 w-1/2" />
			<Skeleton className="h-4 w-5/6" />
		</div>
	);
};

export function Loading({
	variant = "spinner",
	size = "md",
	text,
	fullScreen = false,
	overlay = false,
	className,
	...props
}: LoadingProps) {
	const renderLoader = () => {
		switch (variant) {
			case "spinner":
				return <LoadingSpinner size={size} />;
			case "pulse":
				return <LoadingPulse size={size} />;
			case "dots":
				return <LoadingDots size={size} />;
			case "medical":
				return <LoadingMedical size={size} />;
			case "skeleton":
				return <LoadingSkeleton />;
			case "cards":
				return <LoadingCards />;
			default:
				return <LoadingSpinner size={size} />;
		}
	};

	const content = (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3 !w-full",
				fullScreen && "min-h-screen",
				className
			)}
			{...props}
		>
			{renderLoader()}
			{text && (
				<p className="text-sm text-muted-foreground animate-pulse">
					{text}
				</p>
			)}
		</div>
	);

	if (overlay) {
		return (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
				{content}
			</div>
		);
	}

	return content;
}

// Specialized loading components for common use cases
export const PageLoading = ({ text = "Loading..." }: { text?: string }) => (
	<Loading
		variant="medical"
		size="lg"
		text={text}
		fullScreen
		className="text-center"
	/>
);

export const ButtonLoading = ({
	size = "sm",
}: {
	size?: LoadingProps["size"];
}) => <LoadingSpinner size={size} className="text-current" />;

export const TableLoading = ({ rows = 5 }: { rows?: number }) => (
	<div className="space-y-3 p-6">
		{Array.from({ length: rows }).map((_, i) => (
			<div key={i} className="flex items-center space-x-4">
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 flex-1" />
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-4 w-16" />
			</div>
		))}
	</div>
);

export const LoadingCards = () => {
	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{[...Array(6)].map((_, i) => (
				<Card key={i} className="animate-pulse h-[300px]">
					<CardContent className="p-6">
						<div className="flex items-center gap-3 mb-4">
							<div className="w-12 h-12 bg-accent rounded-full"></div>
							<div className="flex-1">
								<div className="h-4 bg-accent rounded mb-2"></div>
								<div className="h-3 bg-accent rounded w-3/4"></div>
							</div>
						</div>
						<div className="space-y-2">
							<div className="h-3 bg-accent rounded"></div>
							<div className="h-3 bg-accent rounded w-5/6"></div>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
};

export const CardLoading = () => (
	<div className="space-y-4 p-6">
		<Skeleton className="h-6 w-3/4" />
		<div className="space-y-2">
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-4/6" />
		</div>
	</div>
);

export const FormLoading = () => (
	<div className="space-y-4 p-6">
		<div className="space-y-2">
			<Skeleton className="h-4 w-20" />
			<Skeleton className="h-10 w-full" />
		</div>
		<div className="space-y-2">
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-10 w-full" />
		</div>
		<div className="space-y-2">
			<Skeleton className="h-4 w-16" />
			<Skeleton className="h-10 w-full" />
		</div>
		<Skeleton className="h-10 w-32" />
	</div>
);
