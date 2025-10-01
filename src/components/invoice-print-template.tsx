import { useLoaderData } from "@tanstack/react-router";
import type { Invoice } from "@/hooks/useInvoices";
import { formatCurrency } from "@/lib/utils";
import { usePatient } from "@/hooks/usePatients";
import { InvoicePrintTemplateSkeleton } from "./invoice-print-template-skeleton";

interface InvoicePrintTemplateProps {
	invoice: Invoice;
}

export function InvoicePrintTemplate({ invoice }: InvoicePrintTemplateProps) {
	const { clinicInfo } = useLoaderData({ from: "/_authenticated" });
	if (!invoice) return null;

	const invoiceItems = invoice.items ? JSON.parse(invoice.items) : [];
	const outstandingAmount = invoice.totalAmount - invoice.paidAmount;
	const { data: patient, isLoading } = usePatient(invoice.patientId);

	return isLoading ? (
		<InvoicePrintTemplateSkeleton />
	) : (
		<div className="invoice-print-template bg-white text-black print-only">
			{/* Header */}
			<div className="border-b-2 border-gray-800 pb-6 mb-8">
				<div className="flex justify-between items-start">
					<div className="flex-1">
						<h1 className="text-4xl font-bold text-gray-800 mb-2">INVOICE</h1>
						<div className="text-sm text-gray-600 space-y-1">
							<p className="font-semibold">
								Invoice #: {invoice.invoiceNumber}
							</p>
							<p>
								Issue Date: {new Date(invoice.createdAt).toLocaleDateString()}
							</p>
							<p>
								Due Date:{" "}
								{invoice.dueDate
									? new Date(invoice.dueDate).toLocaleDateString()
									: "N/A"}
							</p>
						</div>
					</div>

					<div className="text-right">
						<div className="text-3xl font-bold text-gray-800 mb-2">
							Clinic Run
						</div>
						<div className="text-sm text-gray-600">
							<p>{clinicInfo.address}</p>
							<p>Phone: {clinicInfo.phone}</p>
							<p>Email: {clinicInfo.email}</p>
						</div>
					</div>
				</div>
			</div>

			{/* Bill To Section */}
			<div className="mb-8">
				<h2 className="text-lg font-semibold text-gray-800 mb-4">Bill To:</h2>
				<div className="bg-gray-50 p-4 rounded">
					<div className="font-semibold text-lg text-gray-800 mb-1">
						{invoice.patient?.firstName} {invoice.patient?.lastName}
					</div>
					<div className="text-sm text-gray-600 space-y-1">
						<p>Patient ID: {invoice.patient?.patientId}</p>
						<p>Phone: {patient?.phone}</p>
						<p>Email: {patient?.email}</p>
					</div>
				</div>
			</div>

			{/* Invoice Items Table */}
			<div className="mb-8">
				<table className="w-full border-collapse border border-gray-300">
					<thead>
						<tr className="bg-gray-100">
							<th className="border border-gray-300 px-4 py-3 text-left font-semibold">
								Description
							</th>
							<th className="border border-gray-300 px-4 py-3 text-center font-semibold">
								Quantity
							</th>
							<th className="border border-gray-300 px-4 py-3 text-right font-semibold">
								Unit Price
							</th>
							<th className="border border-gray-300 px-4 py-3 text-right font-semibold">
								Amount
							</th>
						</tr>
					</thead>
					<tbody>
						{invoiceItems.map((item: any, index: number) => (
							<tr key={index} className="border-b border-gray-200">
								<td className="border border-gray-300 px-4 py-3">
									{item.description || "Medical Service"}
								</td>
								<td className="border border-gray-300 px-4 py-3 text-center">
									{item.quantity || 1}
								</td>
								<td className="border border-gray-300 px-4 py-3 text-right">
									{formatCurrency(item.amount || 0)}
								</td>
								<td className="border border-gray-300 px-4 py-3 text-right font-medium">
									{formatCurrency((item.quantity || 1) * (item.amount || 0))}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Summary Section */}
			<div className="flex justify-end mb-8">
				<div className="w-64">
					<div className="border-t-2 border-gray-800 pt-4 space-y-2">
						<div className="flex justify-between">
							<span className="font-medium">Subtotal:</span>
							<span>{formatCurrency(invoice.totalAmount)}</span>
						</div>
						<div className="flex justify-between">
							<span className="font-medium">Tax:</span>
							<span>{formatCurrency(0)}</span>
						</div>
						<div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
							<span>Total:</span>
							<span>{formatCurrency(invoice.totalAmount)}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Payment Information */}
			<div className="grid grid-cols-2 gap-8 mb-8">
				<div>
					<h3 className="font-semibold text-gray-800 mb-2">Payment Status</h3>
					<div className="space-y-1 text-sm">
						<div className="flex justify-between">
							<span>Total Amount:</span>
							<span className="font-medium">
								{formatCurrency(invoice.totalAmount)}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Amount Paid:</span>
							<span className="font-medium text-green-600">
								{formatCurrency(invoice.paidAmount)}
							</span>
						</div>
						<div className="flex justify-between">
							<span>Outstanding:</span>
							<span className="font-medium text-red-600">
								{formatCurrency(outstandingAmount)}
							</span>
						</div>
						<div className="flex justify-between pt-2 border-t border-gray-300">
							<span>Status:</span>
							<span
								className={`font-medium px-2 py-1 rounded text-xs ${
									invoice.status === "paid"
										? "bg-green-100 text-green-800"
										: invoice.status === "pending"
											? "bg-yellow-100 text-yellow-800"
											: invoice.status === "overdue"
												? "bg-red-100 text-red-800"
												: "bg-gray-100 text-gray-800"
								}`}
							>
								{invoice.status?.toUpperCase()}
							</span>
						</div>
					</div>
				</div>

				<div>
					<h3 className="font-semibold text-gray-800 mb-2">Payment Terms</h3>
					<div className="text-sm text-gray-600 space-y-1">
						<p>Payment is due within 30 days of invoice date.</p>
						<p>Late payments may incur additional fees.</p>
						<p>Please include invoice number on all payments.</p>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-600">
				<p className="mb-2">
					Thank you for choosing Clinic Run for your healthcare needs.
				</p>
				<p>
					For questions about this invoice, please contact us at{" "}
					{clinicInfo.phone} or {clinicInfo.email}.
				</p>
				<p className="mt-4 text-xs">
					This is a computer-generated invoice and does not require a signature.
				</p>
			</div>
		</div>
	);
}
