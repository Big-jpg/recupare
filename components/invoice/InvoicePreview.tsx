// components/invoice/InvoicePreview.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface InvoiceData {
    upload: {
        id: string;
        original_filename: string;
        filesize: number;
        uploaded_at: string;
        content: string;
    };
    invoice: {
        id: number;
        filename: string;
        vendor: string;
        company: string;
        invoice_number: string;
        po_number: string;
        invoice_date: string;
        due_date: string;
        amount_due: number;
        total: number;
        document_type: string;
        customer_name: string;
        invoice_total: number;
        sub_total: number;
        total_tax: number;
        created_at: string;
    };
}

interface InvoicePreviewProps {
    slug: string;
}

export function InvoicePreview({ slug }: InvoicePreviewProps) {
    const [data, setData] = useState<InvoiceData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchInvoiceData() {
            try {
                const response = await fetch(`/api/invoice/card/${slug}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch invoice data: ${response.statusText}`);
                }
                const result = await response.json();
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load invoice data");
            } finally {
                setLoading(false);
            }
        }

        if (slug) {
            fetchInvoiceData();
        }
    }, [slug]);

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-red-600">Error: {error}</div>
                </CardContent>
            </Card>
        );
    }

    if (!data) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-gray-600">No invoice data found</div>
                </CardContent>
            </Card>
        );
    }

    const { upload, invoice } = data;
    const pdfDataUrl = `data:application/pdf;base64,${upload.content}`;

    return (
        <div className="space-y-6">
            {/* Invoice Metadata */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Invoice Details</span>
                        <Badge variant={invoice.document_type === 'TaxInvoice' ? 'default' : 'secondary'}>
                            {invoice.document_type || 'Unknown'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-sm text-gray-600">Invoice Number</h4>
                            <p className="text-lg">{invoice.invoice_number || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-600">Vendor</h4>
                            <p className="text-lg">{invoice.vendor || 'N/A'}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-600">Total Amount</h4>
                            <p className="text-lg font-bold text-green-600">
                                ${invoice.total ? Number(invoice.total).toFixed(2) : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-600">Invoice Date</h4>
                            <p className="text-lg">
                                {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-600">Due Date</h4>
                            <p className="text-lg">
                                {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-600">Company</h4>
                            <p className="text-lg">{invoice.company || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Additional Details */}
                    {(invoice.po_number || invoice.customer_name || invoice.sub_total || invoice.total_tax) && (
                        <div className="border-t pt-4 mt-4">
                            <h4 className="font-semibold text-sm text-gray-600 mb-3">Additional Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {invoice.po_number && (
                                    <div>
                                        <span className="text-sm text-gray-600">PO Number:</span>
                                        <span className="ml-2">{invoice.po_number}</span>
                                    </div>
                                )}
                                {invoice.customer_name && (
                                    <div>
                                        <span className="text-sm text-gray-600">Customer:</span>
                                        <span className="ml-2">{invoice.customer_name}</span>
                                    </div>
                                )}
                                {invoice.sub_total && (
                                    <div>
                                        <span className="text-sm text-gray-600">Subtotal:</span>
                                        <span className="ml-2">${Number(invoice.sub_total).toFixed(2)}</span>
                                    </div>
                                )}
                                {invoice.total_tax && (
                                    <div>
                                        <span className="text-sm text-gray-600">Tax:</span>
                                        <span className="ml-2">${Number(invoice.total_tax).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* PDF Viewer */}
            <Card>
                <CardHeader>
                    <CardTitle>Document Preview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="w-full h-96 border rounded-lg overflow-hidden">
                        <iframe
                            src={pdfDataUrl}
                            className="w-full h-full"
                            title="Invoice PDF Preview"
                        />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button asChild>
                            <a href={pdfDataUrl} download={upload.original_filename}>
                                Download PDF
                            </a>
                        </Button>
                        <Button variant="outline" asChild>
                            <a href={pdfDataUrl} target="_blank" rel="noopener noreferrer">
                                Open in New Tab
                            </a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

