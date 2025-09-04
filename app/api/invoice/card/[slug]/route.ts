// app/api/invoice/card/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { stackServerApp } from "@/lib/stack";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
    try {
        // Authenticate user with Stack Auth
        const user = await stackServerApp.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { slug } = await params;

        if (!slug || !/^[0-9a-fA-F-]{36}$/.test(slug)) {
            return NextResponse.json({ error: "Invalid or missing slug." }, { status: 400 });
        }

        // Get upload with user verification
        const uploads = await sql`
            SELECT id, original_filename, filesize, uploaded_at, encode(content, 'base64') AS content
            FROM invoice_uploads
            WHERE id = ${slug}::uuid AND user_id = ${user.id}
            LIMIT 1;
        `;
        
        const upload = uploads[0];

        if (!upload) {
            return NextResponse.json({ error: "Upload not found." }, { status: 404 });
        }

        // Get invoice with user verification
        const invoices = await sql`
            SELECT * FROM invoices
            WHERE filename = ${upload.original_filename} AND user_id = ${user.id}
            LIMIT 1;
        `;
        
        const invoice = invoices[0];

        if (!invoice) {
            return NextResponse.json({ error: "Invoice metadata not found." }, { status: 404 });
        }

        return NextResponse.json({ upload, invoice });
    } catch (error) {
        console.error("[API] Failed to fetch invoice preview:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

