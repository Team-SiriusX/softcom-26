import { db } from "../src/lib/db";
import {
  AccountType,
  AccountSubType,
  BalanceType,
  TransactionType,
  EntryType,
  CategoryType,
} from "@/generated/prisma";

const userId = "HWyCyGjc5MopTM2d0gIJxvFtn5zMrAOo";

if (!userId) {
  console.error("Please provide a user ID");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Starting database seed...");
  console.log(`Seeding for user: ${userId}`);

  try {
    // Create a sample business
    console.log("Creating business...");
    const business = await db.business.create({
      data: {
        name: "Acme Corporation",
        email: "accounting@acmecorp.com",
        phone: "+1-555-0123",
        address: "123 Business St, San Francisco, CA 94102",
        taxId: "12-3456789",
        currency: "USD",
        fiscalYearStart: 1, // January
        userId,
      },
    });
    console.log(`✅ Created business: ${business.name}`);

    // Create Chart of Accounts
    console.log("\nCreating chart of accounts...");
    const accounts = await db.ledgerAccount.createMany({
      data: [
        // ASSETS
        {
          code: "1000",
          name: "Cash",
          accountType: AccountType.ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1010",
          name: "Petty Cash",
          accountType: AccountType.ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1100",
          name: "Accounts Receivable",
          accountType: AccountType.ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1200",
          name: "Inventory",
          accountType: AccountType.ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1500",
          name: "Equipment",
          accountType: AccountType.ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1510",
          name: "Accumulated Depreciation - Equipment",
          accountType: AccountType.ASSET,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // LIABILITIES
        {
          code: "2000",
          name: "Accounts Payable",
          accountType: AccountType.LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "2100",
          name: "Credit Card Payable",
          accountType: AccountType.LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "2200",
          name: "Loans Payable",
          accountType: AccountType.LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "2300",
          name: "Salaries Payable",
          accountType: AccountType.LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // EQUITY
        {
          code: "3000",
          name: "Owner's Capital",
          accountType: AccountType.EQUITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "3100",
          name: "Retained Earnings",
          accountType: AccountType.EQUITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // REVENUE
        {
          code: "4000",
          name: "Sales Revenue",
          accountType: AccountType.REVENUE,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "4100",
          name: "Service Revenue",
          accountType: AccountType.REVENUE,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "4900",
          name: "Other Income",
          accountType: AccountType.REVENUE,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // EXPENSES
        {
          code: "5000",
          name: "Cost of Goods Sold",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6000",
          name: "Salaries Expense",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6100",
          name: "Rent Expense",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6200",
          name: "Utilities Expense",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6300",
          name: "Marketing Expense",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6400",
          name: "Office Supplies",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6500",
          name: "Depreciation Expense",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6600",
          name: "Interest Expense",
          accountType: AccountType.EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
      ],
    });
    console.log(`✅ Created ${accounts.count} ledger accounts`);

    // Fetch created accounts for reference
    const fetchedAccounts = await db.ledgerAccount.findMany({
      where: { businessId: business.id },
    });
    const accountMap = new Map(fetchedAccounts.map((acc) => [acc.code, acc]));

    // Create Categories
    console.log("\nCreating categories...");
    const categories = await db.category.createMany({
      data: [
        {
          name: "Sales",
          description: "Product and service sales",
          color: "#10b981",
          businessId: business.id,
        },
        {
          name: "Operating Expenses",
          description: "Day-to-day business expenses",
          color: "#ef4444",
          businessId: business.id,
        },
        {
          name: "Payroll",
          description: "Employee salaries and wages",
          color: "#f59e0b",
          businessId: business.id,
        },
        {
          name: "Marketing",
          description: "Marketing and advertising costs",
          color: "#8b5cf6",
          businessId: business.id,
        },
        {
          name: "Capital",
          description: "Owner investments and equity",
          color: "#06b6d4",
          businessId: business.id,
        },
      ],
    });
    console.log(`✅ Created ${categories.count} categories`);

    // Fetch categories
    const fetchedCategories = await db.category.findMany({
      where: { businessId: business.id },
    });
    const categoryMap = new Map(
      fetchedCategories.map((cat) => [cat.name, cat])
    );

    // Create sample transactions
    console.log("\nCreating transactions...");

    // Transaction 1: Owner's initial capital investment
    const transaction1 = await db.transaction.create({
      data: {
        date: new Date("2024-01-01"),
        description: "Initial capital investment by owner",
        amount: 100000,
        transactionType: TransactionType.EQUITY,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Capital")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 100000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 100000,
              ledgerAccountId: accountMap.get("3000")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    // Update account balances for transaction 1
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 100000, credit: 0, balance: 100000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("3000")!.id },
      data: { debit: 0, credit: 100000, balance: 100000 },
    });

    // Transaction 2: Purchase equipment
    const transaction2 = await db.transaction.create({
      data: {
        date: new Date("2024-01-05"),
        description: "Purchase of office equipment",
        amount: 25000,
        transactionType: TransactionType.EXPENSE,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Operating Expenses")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 25000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1500")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 25000,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    await db.ledgerAccount.update({
      where: { id: accountMap.get("1500")!.id },
      data: { debit: 25000, credit: 0, balance: 25000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 100000, credit: 25000, balance: 75000 },
    });

    // Transaction 3: Sales revenue
    const transaction3 = await db.transaction.create({
      data: {
        date: new Date("2024-01-10"),
        description: "Sales revenue for January - Week 1",
        amount: 15000,
        transactionType: TransactionType.INCOME,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Sales")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 15000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 15000,
              ledgerAccountId: accountMap.get("4000")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 115000, credit: 25000, balance: 90000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("4000")!.id },
      data: { debit: 0, credit: 15000, balance: 15000 },
    });

    // Transaction 4: Rent expense
    const transaction4 = await db.transaction.create({
      data: {
        date: new Date("2024-01-15"),
        description: "Office rent payment for January",
        amount: 3000,
        transactionType: TransactionType.EXPENSE,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Operating Expenses")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 3000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6100")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 3000,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    await db.ledgerAccount.update({
      where: { id: accountMap.get("6100")!.id },
      data: { debit: 3000, credit: 0, balance: 3000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 115000, credit: 28000, balance: 87000 },
    });

    // Transaction 5: Salary payment
    const transaction5 = await db.transaction.create({
      data: {
        date: new Date("2024-01-20"),
        description: "Employee salaries for January",
        amount: 12000,
        transactionType: TransactionType.EXPENSE,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Payroll")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 12000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6000")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 12000,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    await db.ledgerAccount.update({
      where: { id: accountMap.get("6000")!.id },
      data: { debit: 12000, credit: 0, balance: 12000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 115000, credit: 40000, balance: 75000 },
    });

    // Transaction 6: Marketing expense
    const transaction6 = await db.transaction.create({
      data: {
        date: new Date("2024-01-25"),
        description: "Digital marketing campaign",
        amount: 2500,
        transactionType: TransactionType.EXPENSE,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Marketing")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 2500,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6300")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 2500,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    await db.ledgerAccount.update({
      where: { id: accountMap.get("6300")!.id },
      data: { debit: 2500, credit: 0, balance: 2500 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 115000, credit: 42500, balance: 72500 },
    });

    // Transaction 7: Service revenue
    const transaction7 = await db.transaction.create({
      data: {
        date: new Date("2024-01-28"),
        description: "Consulting services revenue",
        amount: 8500,
        transactionType: TransactionType.INCOME,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Sales")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 8500,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 8500,
              ledgerAccountId: accountMap.get("4100")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 123500, credit: 42500, balance: 81000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("4100")!.id },
      data: { debit: 0, credit: 8500, balance: 8500 },
    });

    // Transaction 8: Utilities
    const transaction8 = await db.transaction.create({
      data: {
        date: new Date("2024-01-30"),
        description: "Electricity and water bills",
        amount: 450,
        transactionType: TransactionType.EXPENSE,
        isReconciled: false,
        businessId: business.id,
        categoryId: categoryMap.get("Operating Expenses")?.id,
        journalEntries: {
          create: [
            {
              entryType: EntryType.DEBIT,
              debitAmount: 450,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6200")!.id,
              businessId: business.id,
            },
            {
              entryType: EntryType.CREDIT,
              debitAmount: 0,
              creditAmount: 450,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
          ],
        },
      },
    });

    await db.ledgerAccount.update({
      where: { id: accountMap.get("6200")!.id },
      data: { debit: 450, credit: 0, balance: 450 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { debit: 123500, credit: 42950, balance: 80550 },
    });

    console.log("✅ Created 8 sample transactions with journal entries");

    // Create a financial insight
    console.log("\nCreating financial insights...");
    await db.financialInsight.create({
      data: {
        title: "Strong Cash Position",
        content:
          "Your business maintains a healthy cash balance of $80,550. This provides good liquidity for operational needs and unexpected expenses. Consider investing excess cash in short-term instruments for better returns.",
        type: "recommendation",
        priority: "medium",
        metadata: {
          cashBalance: 80550,
          quickRatio: 2.5,
          currentRatio: 3.2,
        },
        businessId: business.id,
      },
    });

    await db.financialInsight.create({
      data: {
        title: "Revenue Growth Opportunity",
        content:
          "January revenue totals $23,500 from sales and services. Based on current trends, consider expanding marketing efforts to capitalize on strong service revenue performance (36% of total revenue).",
        type: "insight",
        priority: "high",
        metadata: {
          totalRevenue: 23500,
          salesRevenue: 15000,
          serviceRevenue: 8500,
        },
        businessId: business.id,
      },
    });

    console.log("✅ Created 2 financial insights");

    // Create a chat message
    console.log("\nCreating AI chat messages...");
    await db.chatMessage.create({
      data: {
        role: "user",
        content: "What's my current cash position and burn rate?",
        businessId: business.id,
      },
    });

    await db.chatMessage.create({
      data: {
        role: "assistant",
        content:
          "Based on your January financials:\n\n💰 **Cash Position**: $80,550\n📉 **Monthly Burn Rate**: ~$17,950/month\n⏱️ **Runway**: Approximately 4.5 months at current burn rate\n\n**Breakdown:**\n- Operating Expenses: $5,950\n- Payroll: $12,000\n\nYour revenue of $23,500 covers your expenses, leaving you cash-flow positive. Keep monitoring your burn rate as you scale operations.",
        businessId: business.id,
      },
    });

    console.log("✅ Created 2 chat messages");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Business: ${business.name}`);
    console.log(`- Ledger Accounts: ${accounts.count}`);
    console.log(`- Categories: ${categories.count}`);
    console.log("- Transactions: 8");
    console.log("- Financial Insights: 2");
    console.log("- Chat Messages: 2");
    console.log(`\n💡 Business ID: ${business.id}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
