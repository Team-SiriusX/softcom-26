import { db } from "../src/lib/db";
import {
  AccountType,
  AccountSubType,
  BalanceType,
  TransactionType,
  EntryType,
  CategoryType,
} from "@/generated/prisma";

const userId = "HWyCyGjc5MopTM2d0gIJxvFtn5zMrAOo"; // Mohid
// const userId = "JAKDvi8b5aNLnjTn4PVP9fDVXwKqgfKH"; // Ahmad
// const userId = "QV5R49scripA9K3OvRZTjCXaBL6ibvMboyMwq"; // Hassan

if (!userId) {
  console.error("Please provide a user ID");
  process.exit(1);
}

// Helper function to generate a random amount within a range
function randomAmount(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to add months to a date
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

// Helper function to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function seed() {
  console.log("🌱 Starting database seed...");
  console.log(`Seeding for user: ${userId}`);
  
  // Today's date
  const today = new Date("2025-12-20");
  // One year ago from today
  const startDate = addMonths(today, -12);
  console.log(`📅 Generating 1 year of data from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

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
        currency: "PKR",
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

    // Create transactions over 1 year
    console.log("\nCreating transactions for 1 year...");

    let entryCounter = 1;
    let transactionCounter = 0;
    let cashBalance = 0;

    // Transaction 1: Owner's initial capital investment (start date)
    await db.transaction.create({
      data: {
        date: startDate,
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
              date: startDate,
              entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
              description: "Cash received from owner investment",
              entryType: EntryType.STANDARD,
              debitAmount: 100000,
              creditAmount: 0,
              ledgerAccountId: accountMap.get("1000")!.id,
              businessId: business.id,
            },
            {
              date: startDate,
              entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
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
    transactionCounter++;

    cashBalance += 100000;

    // Track all account balances
    const accountBalances = new Map<string, number>();
    accountBalances.set("1000", cashBalance); // Cash
    accountBalances.set("3000", 100000); // Owner's Capital

    // Generate transactions for each month
    for (let month = 0; month < 12; month++) {
      const monthStart = addMonths(startDate, month);
      const monthName = monthStart.toLocaleString("default", { month: "long" });
      console.log(`  📆 Generating transactions for ${monthName} ${monthStart.getFullYear()}...`);

      // Equipment purchase (first month only)
      if (month === 0) {
        const equipmentDate = addDays(monthStart, 2);
        const equipmentAmount = 25000;
        
        await db.transaction.create({
          data: {
            date: equipmentDate,
            description: "Purchase of office equipment",
            amount: equipmentAmount,
            type: TransactionType.EXPENSE,
            ledgerAccountId: accountMap.get("1500")!.id,
            isReconciled: true,
            businessId: business.id,
            categoryId: categoryMap.get("Operating Expenses")?.id,
            journalEntries: {
              create: [
                {
                  date: equipmentDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Equipment purchase",
                  entryType: EntryType.STANDARD,
                  debitAmount: equipmentAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("1500")!.id,
                  businessId: business.id,
                },
                {
                  date: equipmentDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Cash paid for equipment",
                  entryType: EntryType.STANDARD,
                  debitAmount: 0,
                  creditAmount: equipmentAmount,
                  ledgerAccountId: accountMap.get("1000")!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        cashBalance -= equipmentAmount;
        accountBalances.set("1000", cashBalance);
        accountBalances.set("1500", equipmentAmount);
      }

      // Loan (third month only)
      if (month === 2) {
        const loanDate = addDays(monthStart, 5);
        const loanAmount = 50000;
        
        await db.transaction.create({
          data: {
            date: loanDate,
            description: "Business loan from bank",
            amount: loanAmount,
            type: TransactionType.TRANSFER,
            ledgerAccountId: accountMap.get("1000")!.id,
            isReconciled: true,
            businessId: business.id,
            categoryId: categoryMap.get("Capital")?.id,
            journalEntries: {
              create: [
                {
                  date: loanDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Cash received from loan",
                  entryType: EntryType.STANDARD,
                  debitAmount: loanAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("1000")!.id,
                  businessId: business.id,
                },
                {
                  date: loanDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Loan payable",
                  entryType: EntryType.STANDARD,
                  debitAmount: 0,
                  creditAmount: loanAmount,
                  ledgerAccountId: accountMap.get("2200")!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        cashBalance += loanAmount;
        accountBalances.set("1000", cashBalance);
        accountBalances.set("2200", loanAmount);
      }

      // Weekly sales revenue (3-5 times per month)
      const salesCount = randomAmount(3, 5);
      for (let i = 0; i < salesCount; i++) {
        const salesDate = addDays(monthStart, randomAmount(1, 28));
        const salesAmount = randomAmount(8000, 35000);
        const accountCode = Math.random() > 0.6 ? "4000" : "4100"; // Sales or Service revenue
        const description = accountCode === "4000" 
          ? `Product sales - ${["Electronics", "Furniture", "Equipment", "Merchandise"][randomAmount(0, 3)]}`
          : `${["Consulting", "Maintenance", "Support", "Training"][randomAmount(0, 3)]} services`;

        await db.transaction.create({
          data: {
            date: salesDate,
            description,
            amount: salesAmount,
            type: TransactionType.INCOME,
            ledgerAccountId: accountMap.get("1000")!.id,
            isReconciled: Math.random() > 0.2,
            businessId: business.id,
            categoryId: categoryMap.get("Sales")?.id,
            journalEntries: {
              create: [
                {
                  date: salesDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: `Cash from ${accountCode === "4000" ? "sales" : "services"}`,
                  entryType: EntryType.STANDARD,
                  debitAmount: salesAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("1000")!.id,
                  businessId: business.id,
                },
                {
                  date: salesDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: `${accountCode === "4000" ? "Sales" : "Service"} revenue earned`,
                  entryType: EntryType.STANDARD,
                  debitAmount: 0,
                  creditAmount: salesAmount,
                  ledgerAccountId: accountMap.get(accountCode)!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        cashBalance += salesAmount;
        const currentRevenue = accountBalances.get(accountCode) || 0;
        accountBalances.set(accountCode, currentRevenue + salesAmount);
        accountBalances.set("1000", cashBalance);
      }

      // Monthly salary payment
      const salaryDate = addDays(monthStart, 1);
      const salaryAmount = randomAmount(12000, 18000);
      
      await db.transaction.create({
        data: {
          date: salaryDate,
          description: `Employee salaries for ${monthName}`,
          amount: salaryAmount,
          type: TransactionType.EXPENSE,
          ledgerAccountId: accountMap.get("6000")!.id,
          isReconciled: true,
          businessId: business.id,
          categoryId: categoryMap.get("Payroll")?.id,
          journalEntries: {
            create: [
              {
                date: salaryDate,
                entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                description: "Salaries expense",
                entryType: EntryType.STANDARD,
                debitAmount: salaryAmount,
                creditAmount: 0,
                ledgerAccountId: accountMap.get("6000")!.id,
                businessId: business.id,
              },
              {
                date: salaryDate,
                entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                description: "Cash paid for salaries",
                entryType: EntryType.STANDARD,
                debitAmount: 0,
                creditAmount: salaryAmount,
                ledgerAccountId: accountMap.get("1000")!.id,
                businessId: business.id,
              },
            ],
          },
        },
      });
      transactionCounter++;

      cashBalance -= salaryAmount;
      const currentSalaries = accountBalances.get("6000") || 0;
      accountBalances.set("6000", currentSalaries + salaryAmount);
      accountBalances.set("1000", cashBalance);

      // Monthly rent payment
      const rentDate = addDays(monthStart, randomAmount(1, 5));
      const rentAmount = randomAmount(2500, 3500);
      
      await db.transaction.create({
        data: {
          date: rentDate,
          description: `Office rent payment for ${monthName}`,
          amount: rentAmount,
          type: TransactionType.EXPENSE,
          ledgerAccountId: accountMap.get("6100")!.id,
          isReconciled: true,
          businessId: business.id,
          categoryId: categoryMap.get("Operating Expenses")?.id,
          journalEntries: {
            create: [
              {
                date: rentDate,
                entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                description: "Rent expense",
                entryType: EntryType.STANDARD,
                debitAmount: rentAmount,
                creditAmount: 0,
                ledgerAccountId: accountMap.get("6100")!.id,
                businessId: business.id,
              },
              {
                date: rentDate,
                entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                description: "Cash paid for rent",
                entryType: EntryType.STANDARD,
                debitAmount: 0,
                creditAmount: rentAmount,
                ledgerAccountId: accountMap.get("1000")!.id,
                businessId: business.id,
              },
            ],
          },
        },
      });
      transactionCounter++;

      cashBalance -= rentAmount;
      const currentRent = accountBalances.get("6100") || 0;
      accountBalances.set("6100", currentRent + rentAmount);
      accountBalances.set("1000", cashBalance);

      // Monthly utilities
      const utilityDate = addDays(monthStart, randomAmount(8, 15));
      const utilityAmount = randomAmount(350, 650);
      
      await db.transaction.create({
        data: {
          date: utilityDate,
          description: "Electricity and water bills",
          amount: utilityAmount,
          type: TransactionType.EXPENSE,
          ledgerAccountId: accountMap.get("6200")!.id,
          isReconciled: Math.random() > 0.3,
          businessId: business.id,
          categoryId: categoryMap.get("Operating Expenses")?.id,
          journalEntries: {
            create: [
              {
                date: utilityDate,
                entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                description: "Utilities expense",
                entryType: EntryType.STANDARD,
                debitAmount: utilityAmount,
                creditAmount: 0,
                ledgerAccountId: accountMap.get("6200")!.id,
                businessId: business.id,
              },
              {
                date: utilityDate,
                entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                description: "Cash paid for utilities",
                entryType: EntryType.STANDARD,
                debitAmount: 0,
                creditAmount: utilityAmount,
                ledgerAccountId: accountMap.get("1000")!.id,
                businessId: business.id,
              },
            ],
          },
        },
      });
      transactionCounter++;

      cashBalance -= utilityAmount;
      const currentUtilities = accountBalances.get("6200") || 0;
      accountBalances.set("6200", currentUtilities + utilityAmount);
      accountBalances.set("1000", cashBalance);

      // Marketing expenses (every 2-3 months)
      if (month % 2 === 0 || month % 3 === 0) {
        const marketingDate = addDays(monthStart, randomAmount(10, 20));
        const marketingAmount = randomAmount(2000, 5000);
        
        await db.transaction.create({
          data: {
            date: marketingDate,
            description: `${["Digital marketing", "Social media", "Print advertising", "Event sponsorship"][randomAmount(0, 3)]} campaign`,
            amount: marketingAmount,
            type: TransactionType.EXPENSE,
            ledgerAccountId: accountMap.get("6300")!.id,
            isReconciled: true,
            businessId: business.id,
            categoryId: categoryMap.get("Marketing")?.id,
            journalEntries: {
              create: [
                {
                  date: marketingDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Marketing expense",
                  entryType: EntryType.STANDARD,
                  debitAmount: marketingAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("6300")!.id,
                  businessId: business.id,
                },
                {
                  date: marketingDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Cash paid for marketing",
                  entryType: EntryType.STANDARD,
                  debitAmount: 0,
                  creditAmount: marketingAmount,
                  ledgerAccountId: accountMap.get("1000")!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        cashBalance -= marketingAmount;
        const currentMarketing = accountBalances.get("6300") || 0;
        accountBalances.set("6300", currentMarketing + marketingAmount);
        accountBalances.set("1000", cashBalance);
      }

      // Office supplies (random months)
      if (Math.random() > 0.4) {
        const suppliesDate = addDays(monthStart, randomAmount(5, 25));
        const suppliesAmount = randomAmount(500, 1500);
        
        await db.transaction.create({
          data: {
            date: suppliesDate,
            description: "Office supplies and stationery",
            amount: suppliesAmount,
            type: TransactionType.EXPENSE,
            ledgerAccountId: accountMap.get("6400")!.id,
            isReconciled: true,
            businessId: business.id,
            categoryId: categoryMap.get("Operating Expenses")?.id,
            journalEntries: {
              create: [
                {
                  date: suppliesDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Office supplies expense",
                  entryType: EntryType.STANDARD,
                  debitAmount: suppliesAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("6400")!.id,
                  businessId: business.id,
                },
                {
                  date: suppliesDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Cash paid for supplies",
                  entryType: EntryType.STANDARD,
                  debitAmount: 0,
                  creditAmount: suppliesAmount,
                  ledgerAccountId: accountMap.get("1000")!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        cashBalance -= suppliesAmount;
        const currentSupplies = accountBalances.get("6400") || 0;
        accountBalances.set("6400", currentSupplies + suppliesAmount);
        accountBalances.set("1000", cashBalance);
      }

      // Inventory purchases (every few months)
      if (month % 3 === 0 && month > 0) {
        const inventoryDate = addDays(monthStart, randomAmount(7, 14));
        const inventoryAmount = randomAmount(15000, 25000);
        
        await db.transaction.create({
          data: {
            date: inventoryDate,
            description: "Inventory purchase for resale",
            amount: inventoryAmount,
            type: TransactionType.EXPENSE,
            ledgerAccountId: accountMap.get("1200")!.id,
            isReconciled: true,
            businessId: business.id,
            categoryId: categoryMap.get("Operating Expenses")?.id,
            journalEntries: {
              create: [
                {
                  date: inventoryDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Inventory purchased",
                  entryType: EntryType.STANDARD,
                  debitAmount: inventoryAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("1200")!.id,
                  businessId: business.id,
                },
                {
                  date: inventoryDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Cash paid for inventory",
                  entryType: EntryType.STANDARD,
                  debitAmount: 0,
                  creditAmount: inventoryAmount,
                  ledgerAccountId: accountMap.get("1000")!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        cashBalance -= inventoryAmount;
        const currentInventory = accountBalances.get("1200") || 0;
        accountBalances.set("1200", currentInventory + inventoryAmount);
        accountBalances.set("1000", cashBalance);
      }

      // Quarterly depreciation (every 3 months)
      if (month > 0 && month % 3 === 0) {
        const depreciationDate = addDays(monthStart, 15);
        const depreciationAmount = 625;
        
        await db.transaction.create({
          data: {
            date: depreciationDate,
            description: "Quarterly depreciation on equipment",
            amount: depreciationAmount,
            type: TransactionType.EXPENSE,
            ledgerAccountId: accountMap.get("6500")!.id,
            isReconciled: false,
            businessId: business.id,
            categoryId: categoryMap.get("Operating Expenses")?.id,
            journalEntries: {
              create: [
                {
                  date: depreciationDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Depreciation expense",
                  entryType: EntryType.ADJUSTING,
                  debitAmount: depreciationAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("6500")!.id,
                  businessId: business.id,
                },
                {
                  date: depreciationDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Accumulated depreciation",
                  entryType: EntryType.ADJUSTING,
                  debitAmount: 0,
                  creditAmount: depreciationAmount,
                  ledgerAccountId: accountMap.get("1510")!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        const currentDepreciation = accountBalances.get("6500") || 0;
        const currentAccumulated = accountBalances.get("1510") || 0;
        accountBalances.set("6500", currentDepreciation + depreciationAmount);
        accountBalances.set("1510", currentAccumulated + depreciationAmount);
      }

      // Monthly interest expense (if loan exists)
      if (month >= 2) {
        const interestDate = addDays(monthStart, randomAmount(18, 22));
        const interestAmount = randomAmount(400, 700);
        
        await db.transaction.create({
          data: {
            date: interestDate,
            description: "Interest payment on business loan",
            amount: interestAmount,
            type: TransactionType.EXPENSE,
            ledgerAccountId: accountMap.get("6600")!.id,
            isReconciled: Math.random() > 0.4,
            businessId: business.id,
            categoryId: categoryMap.get("Operating Expenses")?.id,
            journalEntries: {
              create: [
                {
                  date: interestDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Interest expense on loan",
                  entryType: EntryType.STANDARD,
                  debitAmount: interestAmount,
                  creditAmount: 0,
                  ledgerAccountId: accountMap.get("6600")!.id,
                  businessId: business.id,
                },
                {
                  date: interestDate,
                  entryNumber: `JE-${String(entryCounter++).padStart(3, "0")}`,
                  description: "Cash paid for interest",
                  entryType: EntryType.STANDARD,
                  debitAmount: 0,
                  creditAmount: interestAmount,
                  ledgerAccountId: accountMap.get("1000")!.id,
                  businessId: business.id,
                },
              ],
            },
          },
        });
        transactionCounter++;

        cashBalance -= interestAmount;
        const currentInterest = accountBalances.get("6600") || 0;
        accountBalances.set("6600", currentInterest + interestAmount);
        accountBalances.set("1000", cashBalance);
      }
    }

    // Update all final account balances
    console.log("\n📊 Updating final account balances...");
    for (const [code, balance] of accountBalances.entries()) {
      const account = accountMap.get(code);
      if (account) {
        await db.ledgerAccount.update({
          where: { id: account.id },
          data: { currentBalance: balance },
        });
      }
    }

    console.log("✅ Created transactions with journal entries");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`- Business: ${business.name}`);
    console.log(`- Ledger Accounts: ${accounts.count}`);
    console.log(`- Categories: ${categories.count}`);
    console.log(`- Date Range: ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);
    console.log(`- Transactions: ${transactionCounter} (spanning 12 months)`);
    console.log(`- Journal Entries: ${entryCounter - 1}`);
    console.log(`- Final Cash Balance: $${cashBalance.toLocaleString()}`);
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
