// app/api/docs/objects/route.ts
import { NextResponse } from 'next/server';

const SUGGESTIONS: Record<string, { name: string; description: string }[]> = {
  retrieval: [
    { name: 'invoice_pdf', description: 'Invoices (PDF)' },
    { name: 'contract_docx', description: 'Contracts (DOCX)' },
    { name: 'email_msg', description: 'Emails (.msg/.eml)' },
    { name: 'policy_pdf', description: 'Policies & Manuals (PDF)' },
  ],
  parsing: [
    { name: 'receipt_image', description: 'Receipts (images)' },
    { name: 'form_scan', description: 'Scanned forms (PDF/Image)' },
    { name: 'shipment_csv', description: 'Shipment manifests (CSV)' },
  ],
  translation: [
    { name: 'brochure_pdf', description: 'Brochures (PDF)' },
    { name: 'contract_docx', description: 'Contracts (DOCX)' },
    { name: 'support_email', description: 'Support emails' },
  ],
  qa: [
    { name: 'extracted_json', description: 'Extracted JSON bundles' },
    { name: 'table_csv', description: 'Tables (CSV)' },
  ],
  export: [
    { name: 'normalized_json', description: 'Normalized JSON' },
    { name: 'xlsx_report', description: 'Excel report (XLSX)' },
  ],
  indexing: [
    { name: 'raw_pdf', description: 'Raw PDFs' },
    { name: 'ocr_text', description: 'OCR text chunks' },
  ],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const area = (searchParams.get('area') || '').toLowerCase();
  const objects = SUGGESTIONS[area] ?? [];
  return NextResponse.json({ objects });
}
