// components/invoice/InvoiceCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface InvoiceCardProps {
    invoiceId?: string;
    purchaseOrder?: string;
    amountDue?: number | string;
    vendorName?: string;
    company?: string;
    total?: number | string;
    documentType?: string;
    dueDate?: string;
    customerName?: string;
    invoiceDate?: string;
    invoiceTotal?: number | string;
    subTotal?: number | string;
    totalTax?: number | string;
    pdfDataUrl?: string;
    uploadId?: string;
}

export function InvoiceCard({
    invoiceId,
    purchaseOrder,
    amountDue,
    vendorName,
    company,
    total,
    documentType,
    dueDate,
    customerName,
    invoiceDate,
    invoiceTotal,
    subTotal,
    totalTax,
    pdfDataUrl,
    uploadId,
}: InvoiceCardProps) {
    const formatCurrency = (value: number | string | undefined) => {
        if (!value) return 'N/A';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? 'N/A' : `$${num.toFixed(2)}`;
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">
                            Invoice {invoiceId || 'N/A'}
                        </CardTitle>
                        <p className="text-muted-foreground mt-1">
                            {vendorName || 'Unknown Vendor'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant={documentType === 'TaxInvoice' ? 'default' : 'secondary'}>
                            {documentType || 'Unknown'}
                        </Badge>
                        {total && (
                            <Badge variant="outline" className="text-lg font-bold">
                                {formatCurrency(total)}
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Key Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Invoice Date</h4>
                        <p className="text-base">{formatDate(invoiceDate)}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Due Date</h4>
                        <p className="text-base">{formatDate(dueDate)}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-muted-foreground">Amount Due</h4>
                        <p className="text-base font-semibold text-red-600">
                            {formatCurrency(amountDue)}
                        </p>
                    </div>
                </div>

                {/* Company Information */}
                {(company || customerName) && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Company Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {company && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Company:</span>
                                    <span className="ml-2">{company}</span>
                                </div>
                            )}
                            {customerName && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Customer:</span>
                                    <span className="ml-2">{customerName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Financial Breakdown */}
                {(subTotal || totalTax || invoiceTotal) && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Financial Breakdown</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {subTotal && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Subtotal:</span>
                                    <span className="ml-2">{formatCurrency(subTotal)}</span>
                                </div>
                            )}
                            {totalTax && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Tax:</span>
                                    <span className="ml-2">{formatCurrency(totalTax)}</span>
                                </div>
                            )}
                            {invoiceTotal && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Invoice Total:</span>
                                    <span className="ml-2 font-semibold">{formatCurrency(invoiceTotal)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Additional Information */}
                {purchaseOrder && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Additional Information</h4>
                        <div>
                            <span className="text-sm text-muted-foreground">Purchase Order:</span>
                            <span className="ml-2">{purchaseOrder}</span>
                        </div>
                    </div>
                )}

                {/* PDF Preview */}
                {pdfDataUrl && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold text-sm text-muted-foreground mb-2">Document Preview</h4>
                        <div className="w-full h-64 border rounded-lg overflow-hidden mb-4">
                            <iframe
                                src={pdfDataUrl}
                                className="w-full h-full"
                                title="Invoice PDF Preview"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button asChild>
                                <a href={pdfDataUrl} download={`invoice-${invoiceId || 'unknown'}.pdf`}>
                                    Download PDF
                                </a>
                            </Button>
                            <Button variant="outline" asChild>
                                <a href={pdfDataUrl} target="_blank" rel="noopener noreferrer">
                                    Open in New Tab
                                </a>
                            </Button>
                            {uploadId && (
                                <Button variant="outline" asChild>
                                    <Link href={`/invoice/card/${uploadId}`}>
                                        View Full Details
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

