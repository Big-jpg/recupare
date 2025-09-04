// app/invoice/card/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { InvoiceCard } from "@/components/invoice/InvoiceCard";
import { stackServerApp } from "@/lib/stack";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

interface InvoiceCardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function InvoiceCardPage({ params }: InvoiceCardPageProps) {
  // Ensure user is authenticated
  const user = await stackServerApp.getUser({ or: 'redirect' });
  
  const { slug } = await params;

  if (!slug || !/^[0-9a-fA-F-]{36}$/.test(slug)) {
    notFound();
  }

  try {
    // Get upload with user verification
    const uploads = await sql`
      SELECT id, original_filename, filesize, uploaded_at, content
      FROM invoice_uploads
      WHERE id = ${slug}::uuid AND user_id = ${user.id}
      LIMIT 1;
    `;

    const upload = uploads[0];

    if (!upload) {
      notFound();
    }

    // Get invoice with user verification
    const invoices = await sql`
      SELECT * FROM invoices
      WHERE filename = ${upload.original_filename} AND user_id = ${user.id}
      LIMIT 1;
    `;

    const invoice = invoices[0];

    if (!invoice) {
      notFound();
    }

    // Convert buffer to base64 for PDF display
    const pdfDataUrl = `data:application/pdf;base64,${Buffer.from(upload.content).toString('base64')}`;

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Details</h1>
              <p className="text-gray-600 mt-2">
                Detailed view of processed invoice
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Invoice Card */}
          <InvoiceCard
            invoiceId={invoice.invoice_number ?? undefined}
            purchaseOrder={invoice.po_number ?? undefined}
            amountDue={invoice.amount_due ?? undefined}
            vendorName={invoice.vendor ?? undefined}
            company={invoice.company ?? undefined}
            total={invoice.total ?? undefined}
            documentType={invoice.document_type ?? undefined}
            dueDate={invoice.due_date ?? undefined}
            customerName={invoice.customer_name ?? undefined}
            invoiceDate={
              invoice.invoice_date
                ? new Date(invoice.invoice_date).toISOString().split("T")[0]
                : undefined
            }
            invoiceTotal={invoice.invoice_total ?? undefined}
            subTotal={invoice.sub_total ?? undefined}
            totalTax={invoice.total_tax ?? undefined}
            pdfDataUrl={pdfDataUrl}
            uploadId={slug}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading invoice:", error);
    notFound();
  }
}

