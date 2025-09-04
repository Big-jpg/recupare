# Recupare + InvoicePipe Integration

## Overview

This project successfully integrates InvoicePipe's Azure Content Understanding invoice processing capabilities into Recupare's existing Stack Auth + Neon architecture. The result is a unified platform that combines:

- **Recupare's clean Stack Auth architecture** for secure user authentication
- **InvoicePipe's powerful Azure OCR capabilities** for invoice processing
- **Unified Neon database** for both user data and invoice storage

## 🎯 Key Features

### Invoice Processing
- **PDF Upload & Processing**: Drag-and-drop interface for invoice uploads
- **Azure Content Understanding**: Automatic field extraction from invoices
- **Structured Data**: Vendor, amounts, dates, PO numbers, and more
- **PDF Preview**: In-browser PDF viewing with download capabilities
- **User Isolation**: All invoices are user-specific and secure

### Authentication & Security
- **Stack Auth Integration**: Modern authentication with magic links and social login
- **Route Protection**: Middleware-based protection for sensitive routes
- **User-Scoped Data**: All invoice data is isolated per user
- **Secure API Endpoints**: All API routes require authentication

### Dashboard & UI
- **Unified Dashboard**: Tabbed interface for both invoice processing and AI agent tasks
- **Real-time Processing**: Live status updates during invoice analysis
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI Components**: Built with Radix UI and Tailwind CSS

## 📁 Project Structure

```
workspace/recupare/
├── app/
│   ├── api/
│   │   ├── upload/route.ts              # File upload endpoint
│   │   └── invoice/
│   │       ├── cu-process/route.ts      # Azure CU processing
│   │       └── card/[slug]/route.ts     # Invoice data retrieval
│   ├── dashboard/page.tsx               # Main dashboard with tabs
│   ├── invoice/card/[slug]/page.tsx     # Individual invoice view
│   ├── layout.tsx                       # Root layout with Stack Auth
│   ├── page.tsx                         # Landing page
│   └── globals.css                      # Global styles
├── components/
│   ├── ui/                              # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── tabs.tsx
│   │   └── file-uploader.tsx
│   ├── invoice/                         # Invoice-specific components
│   │   ├── InvoiceCard.tsx
│   │   └── InvoicePreview.tsx
│   └── navigation.tsx                   # Main navigation
├── lib/
│   ├── db.ts                           # Neon database client
│   ├── stack.ts                        # Stack Auth helpers
│   ├── azure-content-understanding.ts  # Azure CU integration
│   ├── normalize-cu-fields.ts          # Field normalization
│   └── utils.ts                        # Utility functions
├── middleware.ts                        # Route protection
├── package.json                         # Dependencies
├── tsconfig.json                        # TypeScript config
├── tailwind.config.ts                   # Tailwind CSS config
├── next.config.js                       # Next.js config
└── .env.example                         # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Neon PostgreSQL database
- Azure Document Intelligence service
- Stack Auth project

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Stack Auth
STACK_PROJECT_ID=your-stack-project-id
STACK_SECRET=your-stack-secret-key
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=your-stack-publishable-key

# Azure Content Understanding
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-region.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-azure-key
```

### Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database Tables**
   The application will automatically create the necessary tables on first run:
   - `invoice_uploads` - Stores uploaded PDF files
   - `invoices` - Stores extracted invoice data
   - Existing Recupare tables for agentic requests

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## 🔧 API Endpoints

### Invoice Processing
- `POST /api/upload` - Upload PDF invoice files
- `POST /api/invoice/cu-process` - Process invoice with Azure CU
- `GET /api/invoice/card/[slug]` - Retrieve invoice data and PDF

### Authentication
All API endpoints are protected by Stack Auth middleware and require valid user authentication.

## 🎨 UI Components

### Dashboard
- **Invoice Processing Tab**: Upload, process, and view invoices
- **AI Agent Tasks Tab**: Existing Recupare functionality for agentic requests
- **Real-time Status**: Live updates during processing

### Invoice Components
- **FileUploader**: Drag-and-drop PDF upload with validation
- **InvoiceCard**: Comprehensive invoice data display
- **InvoicePreview**: Full invoice details with PDF viewer

## 🔒 Security Features

- **Route Protection**: Middleware protects all sensitive routes
- **User Isolation**: All data is scoped to authenticated users
- **Input Validation**: File type and size validation
- **SQL Injection Protection**: Parameterized queries with Neon
- **CORS Configuration**: Proper cross-origin request handling

## 📊 Database Schema

### Invoice Tables
```sql
-- Stores uploaded PDF files
CREATE TABLE invoice_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_filename VARCHAR(255) NOT NULL,
    content BYTEA NOT NULL,
    filesize INTEGER NOT NULL,
    sha256 VARCHAR(64) NOT NULL UNIQUE,
    estimated_page_count INTEGER DEFAULT 1,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) -- Stack Auth user ID
);

-- Stores extracted invoice data
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    vendor VARCHAR(255),
    company VARCHAR(255),
    invoice_number VARCHAR(100),
    po_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    amount_due DECIMAL(10,2),
    total DECIMAL(10,2),
    document_type VARCHAR(50),
    customer_name VARCHAR(255),
    invoice_total DECIMAL(10,2),
    sub_total DECIMAL(10,2),
    total_tax DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id VARCHAR(255) -- Stack Auth user ID
);
```

## 🧪 Testing

### Manual Testing Checklist
1. **Authentication Flow**
   - [ ] Sign up new user
   - [ ] Sign in existing user
   - [ ] Protected routes redirect when unauthenticated
   - [ ] User data isolation

2. **Invoice Processing**
   - [ ] Upload PDF invoice
   - [ ] Process with Azure CU
   - [ ] View extracted data
   - [ ] Download PDF
   - [ ] Handle duplicate uploads

3. **Dashboard Functionality**
   - [ ] Switch between tabs
   - [ ] View invoice history
   - [ ] Access individual invoices
   - [ ] Responsive design

## 🚀 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Configure environment variables
3. Install Stack Auth Vercel Integration
4. Deploy

### Environment Setup
- Ensure all environment variables are configured
- Database tables will be created automatically
- Stack Auth integration handles user management

## 📈 Performance Considerations

- **File Size Limits**: PDFs are limited to reasonable sizes for processing
- **Database Optimization**: Indexes on user_id and filename fields
- **Caching**: Next.js automatic caching for static assets
- **Error Handling**: Comprehensive error handling throughout the application

## 🔄 Migration Notes

This integration successfully:
- ✅ Preserves Recupare's Stack Auth architecture
- ✅ Integrates InvoicePipe's Azure CU functionality
- ✅ Maintains user data isolation
- ✅ Provides unified dashboard experience
- ✅ Ensures secure API endpoints
- ✅ Implements responsive UI design

## 🤝 Contributing

The codebase follows modern Next.js 15 patterns with:
- App Router for routing
- Server Components for performance
- TypeScript for type safety
- Tailwind CSS for styling
- Radix UI for accessible components

## 📝 License

This project integrates components from both Recupare and InvoicePipe under their respective licenses.

