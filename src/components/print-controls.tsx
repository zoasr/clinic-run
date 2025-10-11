import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PrintControlsProps {
	onPrint?: () => void;
	onBack?: () => void;
	showBack?: boolean;
	name?: string;
}

export function PrintControls({
	onPrint,
	onBack,
	showBack = true,
	name = "Invoice",
}: PrintControlsProps) {
	const handlePrint = onPrint || (() => window.print());

	return (
		<div className="print:hidden bg-accent p-4 border-1 border- rounded-t-md">
			<div className="max-w-4xl mx-auto flex items-center justify-between">
				{showBack && onBack && (
					<Button variant="outline" onClick={onBack}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
				)}

				{showBack && !onBack && (
					<Button variant="destructive" onClick={() => window.history.back()}>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
				)}

				<Button onClick={handlePrint}>
					<Printer className="h-4 w-4 mr-2" />
					Print {name}
				</Button>
			</div>
		</div>
	);
}
