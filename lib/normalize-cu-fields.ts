// lib/normalize-cu-fields.ts

export interface CUField {
    content?: string;
    valueNumber?: number;
    valueString?: string;
}

export interface CUFields {
    [key: string]: CUField | undefined;
}

export interface CUContent {
    fields?: CUFields;
}

export interface CURawResult {
    result?: {
        contents?: CUContent[];
        documents?: CUContent[];
    };
    contents?: CUContent[];
    documents?: CUContent[];
    fields?: CUFields;
}

export interface NormalizedInvoice {
    invoiceId: string | null;
    purchaseOrder: string | null;
    amountDue: number | string | null;
    vendorName: string | null;
    company: string | null;
    total: number | string | null;
    documentType: string | null;
    dueDate: string | null;
    customerName: string | null;
    invoiceDate: string | null;
    invoiceTotal: number | string | null;
    subTotal: number | string | null;
    totalTax: number | string | null;
}

export function normalizeCUFields(result: CURawResult): NormalizedInvoice {
    const fields: CUFields =
        result?.result?.documents?.[0]?.fields ??
        result?.documents?.[0]?.fields ??
        result?.result?.contents?.[0]?.fields ??
        result?.contents?.[0]?.fields ??
        result?.fields ??
        {};

    const getString = (key: string): string | null => {
        const field = fields[key];
        return field?.content ?? field?.valueString ?? null;
    };

    const getNumberOrString = (key: string): number | string | null => {
        const field = fields[key];
        return field?.valueNumber ?? field?.valueString ?? field?.content ?? null;
    };

    return {
        invoiceId: getString("InvoiceId"),
        purchaseOrder: getString("PurchaseOrder"),
        amountDue: getNumberOrString("AmountDue"),
        vendorName: getString("VendorName"),
        company: getString("Company") ?? getString("CustomerName"),
        total: getNumberOrString("Total"),
        documentType: getString("DocumentType"),
        dueDate: getString("DueDate"),
        customerName: getString("CustomerName"),
        invoiceDate: getString("InvoiceDate"),
        invoiceTotal: getNumberOrString("InvoiceTotal"),
        subTotal: getNumberOrString("SubTotal"),
        totalTax: getNumberOrString("TotalTax"),
    };
}

