import { db } from "../src/lib/db";
import {
  AccountType,
  AccountSubType,
  BalanceType,
  TransactionType,
  EntryType,
  CategoryType,
} from "@/generated/prisma";

// const userId = "HWyCyGjc5MopTM2d0gIJxvFtn5zMrAOo"; // Mohid
const userId = "JAKDvi8b5aNLnjTn4PVP9fDVXwKqgfKH"; // Ahmad

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
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1010",
          name: "Petty Cash",
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1100",
          name: "Accounts Receivable",
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1200",
          name: "Inventory",
          type: AccountType.ASSET,
          subType: AccountSubType.CURRENT_ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1500",
          name: "Equipment",
          type: AccountType.ASSET,
          subType: AccountSubType.FIXED_ASSET,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "1510",
          name: "Accumulated Depreciation - Equipment",
          type: AccountType.ASSET,
          subType: AccountSubType.FIXED_ASSET,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // LIABILITIES
        {
          code: "2000",
          name: "Accounts Payable",
          type: AccountType.LIABILITY,
          subType: AccountSubType.CURRENT_LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "2100",
          name: "Credit Card Payable",
          type: AccountType.LIABILITY,
          subType: AccountSubType.CURRENT_LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "2200",
          name: "Loans Payable",
          type: AccountType.LIABILITY,
          subType: AccountSubType.LONG_TERM_LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "2300",
          name: "Salaries Payable",
          type: AccountType.LIABILITY,
          subType: AccountSubType.CURRENT_LIABILITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // EQUITY
        {
          code: "3000",
          name: "Owner's Capital",
          type: AccountType.EQUITY,
          subType: AccountSubType.OWNERS_EQUITY,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "3100",
          name: "Retained Earnings",
          type: AccountType.EQUITY,
          subType: AccountSubType.RETAINED_EARNINGS,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // REVENUE
        {
          code: "4000",
          name: "Sales Revenue",
          type: AccountType.REVENUE,
          subType: AccountSubType.OPERATING_REVENUE,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "4100",
          name: "Service Revenue",
          type: AccountType.REVENUE,
          subType: AccountSubType.OPERATING_REVENUE,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "4900",
          name: "Other Income",
          type: AccountType.REVENUE,
          subType: AccountSubType.OTHER_REVENUE,
          normalBalance: BalanceType.CREDIT,
          isActive: true,
          businessId: business.id,
        },

        // EXPENSES
        {
          code: "5000",
          name: "Cost of Goods Sold",
          type: AccountType.EXPENSE,
          subType: AccountSubType.COST_OF_GOODS_SOLD,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6000",
          name: "Salaries Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6100",
          name: "Rent Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6200",
          name: "Utilities Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6300",
          name: "Marketing Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6400",
          name: "Office Supplies",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6500",
          name: "Depreciation Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OPERATING_EXPENSE,
          normalBalance: BalanceType.DEBIT,
          isActive: true,
          businessId: business.id,
        },
        {
          code: "6600",
          name: "Interest Expense",
          type: AccountType.EXPENSE,
          subType: AccountSubType.OTHER_EXPENSE,
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
          type: CategoryType.INCOME,
          color: "#10b981",
          businessId: business.id,
        },
        {
          name: "Operating Expenses",
          description: "Day-to-day business expenses",
          type: CategoryType.EXPENSE,
          color: "#ef4444",
          businessId: business.id,
        },
        {
          name: "Payroll",
          description: "Employee salaries and wages",
          type: CategoryType.EXPENSE,
          color: "#f59e0b",
          businessId: business.id,
        },
        {
          name: "Marketing",
          description: "Marketing and advertising costs",
          type: CategoryType.EXPENSE,
          color: "#8b5cf6",
          businessId: business.id,
        },
        {
          name: "Capital",
          description: "Owner investments and equity",
          type: CategoryType.TRANSFER,
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
        type: TransactionType.TRANSFER,
        ledgerAccountId: accountMap.get("1000")!.id,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Capital")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-01"),
              entryNumber: "JE-001",
              description: "Cash received from owner investment",
              entryType: EntryType.STANDARD,
              debitAmount: 100000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-01"),
              entryNumber: "JE-002",
              description: "Owner's capital investment",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 100000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("3000")!.id },
      data: { currentBalance: 100000 },
    });

    // Transaction 2: Purchase equipment
    const transaction2 = await db.transaction.create({
      data: {
        date: new Date("2024-01-05"),
        description: "Purchase of office equipment",
        amount: 25000,
        type: TransactionType.EXPENSE,
        ledgerAccountId: accountMap.get("1500")!.id,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Operating Expenses")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-05"),
              entryNumber: "JE-003",
              description: "Equipment purchase",
              entryType: EntryType.STANDARD,
              debitAmount: 25000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1500")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-05"),
              entryNumber: "JE-004",
              description: "Cash paid for equipment",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 25000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { currentBalance: 75000 },
    });

    // Transaction 3: Sales revenue
    const transaction3 = await db.transaction.create({
      data: {
        date: new Date("2024-01-10"),
        description: "Sales revenue for January - Week 1",
        amount: 15000,
        type: TransactionType.INCOME,
        ledgerAccountId: accountMap.get("1000")!.id,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Sales")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-10"),
              entryNumber: "JE-005",
              description: "Cash received from sales",
              entryType: EntryType.STANDARD,
              debitAmount: 15000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-10"),
              entryNumber: "JE-006",
              description: "Sales revenue earned",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 90000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("4000")!.id },
      data: { currentBalance: 15000 },
    });

    // Transaction 4: Rent expense
    const transaction4 = await db.transaction.create({
      data: {
        date: new Date("2024-01-15"),
        description: "Office rent payment for January",
        amount: 3000,
        type: TransactionType.EXPENSE,
        ledgerAccountId: accountMap.get("6100")!.id,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Operating Expenses")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-15"),
              entryNumber: "JE-007",
              description: "Rent expense",
              entryType: EntryType.STANDARD,
              debitAmount: 3000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6100")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-15"),
              entryNumber: "JE-008",
              description: "Cash paid for rent",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 3000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { currentBalance: 87000 },
    });

    // Transaction 5: Salary payment
    const transaction5 = await db.transaction.create({
      data: {
        date: new Date("2024-01-20"),
        description: "Employee salaries for January",
        amount: 12000,
        type: TransactionType.EXPENSE,
        ledgerAccountId: accountMap.get("6000")!.id,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Payroll")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-20"),
              entryNumber: "JE-009",
              description: "Salaries expense",
              entryType: EntryType.STANDARD,
              debitAmount: 12000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6000")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-20"),
              entryNumber: "JE-010",
              description: "Cash paid for salaries",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 12000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { currentBalance: 75000 },
    });

    // Transaction 6: Marketing expense
    const transaction6 = await db.transaction.create({
      data: {
        date: new Date("2024-01-25"),
        description: "Digital marketing campaign",
        amount: 2500,
        type: TransactionType.EXPENSE,
        ledgerAccountId: accountMap.get("6300")!.id,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Marketing")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-25"),
              entryNumber: "JE-011",
              description: "Marketing expense",
              entryType: EntryType.STANDARD,
              debitAmount: 2500,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6300")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-25"),
              entryNumber: "JE-012",
              description: "Cash paid for marketing",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 2500 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { currentBalance: 72500 },
    });

    // Transaction 7: Service revenue
    const transaction7 = await db.transaction.create({
      data: {
        date: new Date("2024-01-28"),
        description: "Consulting services revenue",
        amount: 8500,
        type: TransactionType.INCOME,
        ledgerAccountId: accountMap.get("1000")!.id,
        isReconciled: true,
        businessId: business.id,
        categoryId: categoryMap.get("Sales")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-28"),
              entryNumber: "JE-013",
              description: "Cash received from services",
              entryType: EntryType.STANDARD,
              debitAmount: 8500,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-28"),
              entryNumber: "JE-014",
              description: "Service revenue earned",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 81000 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("4100")!.id },
      data: { currentBalance: 8500 },
    });

    // Transaction 8: Utilities
    const transaction8 = await db.transaction.create({
      data: {
        date: new Date("2024-01-30"),
        description: "Electricity and water bills",
        amount: 450,
        type: TransactionType.EXPENSE,
        ledgerAccountId: accountMap.get("6200")!.id,
        isReconciled: false,
        businessId: business.id,
        categoryId: categoryMap.get("Operating Expenses")?.id,
        journalEntries: {
          create: [
            {
              date: new Date("2024-01-30"),
              entryNumber: "JE-015",
              description: "Utilities expense",
              entryType: EntryType.STANDARD,
              debitAmount: 450,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("6200")!.id,
              businessId: business.id,
            },
            {
              date: new Date("2024-01-30"),
              entryNumber: "JE-016",
              description: "Cash paid for utilities",
              entryType: EntryType.STANDARD,
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
      data: { currentBalance: 450 },
    });
    await db.ledgerAccount.update({
      where: { id: accountMap.get("1000")!.id },
      data: { currentBalance: 80550 },
    });

    console.log("✅ Created 8 sample transactions with journal entries");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Business: ${business.name}`);
    console.log(`- Ledger Accounts: ${accounts.count}`);
    console.log(`- Categories: ${categories.count}`);
    console.log("- Transactions: 8");
    console.log("- Journal Entries: 16");
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
