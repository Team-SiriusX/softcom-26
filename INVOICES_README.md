# Invoice Management System

## Features

### Client Management
- Create and manage clients with detailed information (name, email, phone, address, tax ID)
- Track active/inactive status for clients
- View invoice history for each client
- Prevent deletion of clients with existing invoices

### Invoice Creation & Management
- Create invoices with multiple line items
- Track invoice status: Draft, Sent, Viewed, Partial, Paid, Overdue, Cancelled
- Set due dates and issue dates
- Add custom notes and payment terms
- Track partial payments
- Set reminder dates for upcoming payments

### Invoice Features
- **Line Items**: Add multiple items with description, quantity, and unit price
- **Automatic Calculations**: Total amounts calculated automatically
- **Status Tracking**: Full lifecycle management from draft to paid
- **File Attachments**: Support for uploading invoice documents (attachmentUrl field)
- **Payment Reminders**: Set reminder dates for due invoices

### Dashboard & Analytics
- View statistics: total invoices, total amount, paid amount, overdue amount
- Filter invoices by status
- See invoice counts per client
- Quick actions: view, edit, delete invoices

## API Endpoints

### Clients
- `GET /api/clients` - List all clients for a business
- `GET /api/clients/:id` - Get client details with invoice count
- `POST /api/clients` - Create a new client
- `PATCH /api/clients/:id` - Update client information
- `DELETE /api/clients/:id` - Delete a client (only if no invoices exist)

### Invoices
- `GET /api/invoices` - List all invoices with optional filters (status, clientId)
- `GET /api/invoices/stats` - Get invoice statistics (counts and amounts)
- `GET /api/invoices/:id` - Get invoice details with line items
- `POST /api/invoices` - Create a new invoice with line items
- `PATCH /api/invoices/:id` - Update invoice and line items
- `DELETE /api/invoices/:id` - Delete an invoice

## Setting Up Reminders

The invoice system includes reminder functionality through the `reminderDate` and `reminderSent` fields. To implement automated reminders, you can:

### Option 1: Vercel Cron Jobs
Create a cron job in `vercel.json`:

\`\`\`json
{
  "crons": [
    {
      "path": "/api/cron/invoice-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
\`\`\`

Create the endpoint `src/app/api/cron/invoice-reminders/route.ts`:

\`\`\`typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { addDays } from "date-fns";

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  
  // Find invoices with reminder date today or in the past that haven't been sent
  const invoicesToRemind = await db.invoice.findMany({
    where: {
      reminderDate: {
        lte: today,
      },
      reminderSent: false,
      status: {
        in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"],
      },
    },
    include: {
      client: true,
      business: true,
    },
  });

  // Send email reminders (implement your email service)
  for (const invoice of invoicesToRemind) {
    // await sendReminderEmail(invoice);
    
    // Mark as sent
    await db.invoice.update({
      where: { id: invoice.id },
      data: { reminderSent: true },
    });
  }

  return NextResponse.json({ 
    success: true, 
    remindersSent: invoicesToRemind.length 
  });
}
\`\`\`

### Option 2: Manual Check on Invoice View
You can check for overdue invoices when users access the invoices page and send notifications then.

### Option 3: Third-party Services
- Use services like SendGrid for scheduled emails
- Use Zapier to monitor database and send emails
- Use Twilio for SMS reminders

## File Upload Implementation

The `attachmentUrl` field is ready for file uploads. To implement:

1. **Use a file storage service** (Vercel Blob, AWS S3, Cloudinary)
2. **Add upload component** to invoice form
3. **Store URL** in the attachmentUrl field

Example with Vercel Blob:

\`\`\`typescript
import { put } from '@vercel/blob';

// In your API route
const blob = await put(file.name, file, { access: 'public' });
// Save blob.url to invoice.attachmentUrl
\`\`\`

## Database Schema

### Client Model
\`\`\`prisma
model Client {
  id          String    @id @default(cuid())
  name        String
  email       String?
  phone       String?
  address     String?
  taxId       String?
  notes       String?
  isActive    Boolean   @default(true)
  businessId  String
  business    Business  @relation(fields: [businessId], references: [id], onDelete: Cascade)
  invoices    Invoice[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
\`\`\`

### Invoice Model
\`\`\`prisma
model Invoice {
  id              String         @id @default(cuid())
  invoiceNumber   String
  clientId        String
  client          Client         @relation(fields: [clientId], references: [id])
  businessId      String
  business        Business       @relation(fields: [businessId], references: [id], onDelete: Cascade)
  issueDate       DateTime
  dueDate         DateTime
  status          InvoiceStatus  @default(DRAFT)
  subtotal        Decimal        @default(0)
  tax             Decimal        @default(0)
  total           Decimal        @default(0)
  paidAmount      Decimal        @default(0)
  notes           String?
  terms           String?
  attachmentUrl   String?
  reminderDate    DateTime?
  reminderSent    Boolean        @default(false)
  items           InvoiceItem[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
\`\`\`

### InvoiceItem Model
\`\`\`prisma
model InvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  description String
  quantity    Decimal
  unitPrice   Decimal
  amount      Decimal
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
\`\`\`

## Usage

1. **Navigate to Clients**: Add your clients with their contact information
2. **Create Invoice**: Click "Create Invoice" on the invoices page
3. **Select Client**: Choose from your client list
4. **Add Line Items**: Add products/services with quantities and prices
5. **Set Dates**: Set issue date, due date, and optional reminder date
6. **Add Details**: Include notes and payment terms
7. **Save**: Create as draft or mark as sent
8. **Track**: Monitor invoice status and payments

## Future Enhancements

- PDF generation for invoices
- Email invoice directly to clients
- Recurring invoices
- Invoice templates
- Multi-currency support
- Payment gateway integration
- Expense tracking linked to invoices
- Tax calculations
- Invoice numbering automation
- Client portal for viewing invoices
