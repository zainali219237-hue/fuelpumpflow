import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, timestamp, boolean, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'cashier']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'credit', 'fleet']);
export const transactionTypeEnum = pgEnum('transaction_type', ['sale', 'purchase', 'expense', 'payment']);
export const tankStatusEnum = pgEnum('tank_status', ['normal', 'low', 'critical', 'maintenance']);
export const customerTypeEnum = pgEnum('customer_type', ['walk-in', 'credit', 'fleet']);
export const currencyCodeEnum = pgEnum('currency_code', ['PKR', 'INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CNY']);

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('cashier'),
  stationId: varchar("station_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stations table
export const stations = pgTable("stations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  gstNumber: text("gst_number"),
  licenseNumber: text("license_number"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  defaultCurrency: currencyCodeEnum("default_currency").notNull().default('PKR'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // fuel, lubricant, additive
  unit: text("unit").notNull().default('litre'),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  density: decimal("density", { precision: 5, scale: 3 }),
  hsnCode: text("hsn_code"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tanks table
export const tanks = pgTable("tanks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull(),
  name: text("name").notNull(),
  productId: varchar("product_id").notNull(),
  capacity: decimal("capacity", { precision: 10, scale: 2 }).notNull(),
  currentStock: decimal("current_stock", { precision: 10, scale: 2 }).default('0'),
  minimumLevel: decimal("minimum_level", { precision: 10, scale: 2 }).default('500'),
  status: tankStatusEnum("status").default('normal'),
  lastRefillDate: timestamp("last_refill_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: customerTypeEnum("type").notNull().default('walk-in'),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  address: text("address"),
  gstNumber: text("gst_number"),
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }).default('0'),
  outstandingAmount: decimal("outstanding_amount", { precision: 10, scale: 2 }).default('0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  address: text("address"),
  gstNumber: text("gst_number"),
  paymentTerms: text("payment_terms"),
  outstandingAmount: decimal("outstanding_amount", { precision: 10, scale: 2 }).default('0'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales transactions table
export const salesTransactions = pgTable("sales_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  stationId: varchar("station_id").notNull(),
  customerId: varchar("customer_id").notNull(),
  userId: varchar("user_id").notNull(),
  transactionDate: timestamp("transaction_date").defaultNow(),
  dueDate: timestamp("due_date"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  currencyCode: currencyCodeEnum("currency_code").notNull().default('PKR'),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),
  outstandingAmount: decimal("outstanding_amount", { precision: 10, scale: 2 }).default('0'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales transaction items table
export const salesTransactionItems = pgTable("sales_transaction_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull(),
  productId: varchar("product_id").notNull(),
  tankId: varchar("tank_id"),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase orders table
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  stationId: varchar("station_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  userId: varchar("user_id").notNull(),
  orderDate: timestamp("order_date").defaultNow(),
  dueDate: timestamp("due_date"),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  status: text("status").default('pending'), // pending, delivered, cancelled
  currencyCode: currencyCodeEnum("currency_code").notNull().default('PKR'),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default('0'),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default('0'),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase order items table
export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  tankId: varchar("tank_id"),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  receivedQuantity: decimal("received_quantity", { precision: 10, scale: 3 }).default('0'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull(),
  userId: varchar("user_id").notNull(),
  category: text("category").notNull(), // salary, utilities, maintenance, insurance, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currencyCode: currencyCodeEnum("currency_code").notNull().default('PKR'),
  expenseDate: timestamp("expense_date").defaultNow(),
  receiptNumber: text("receipt_number"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  vendorName: text("vendor_name"),
  isRecurring: boolean("is_recurring").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull(),
  userId: varchar("user_id").notNull(),
  customerId: varchar("customer_id"),
  supplierId: varchar("supplier_id"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currencyCode: currencyCodeEnum("currency_code").notNull().default('PKR'),
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  referenceNumber: text("reference_number"),
  notes: text("notes"),
  type: text("type").notNull(), // receivable, payable
  createdAt: timestamp("created_at").defaultNow(),
});

// Stock movements table
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tankId: varchar("tank_id").notNull(),
  stationId: varchar("station_id").notNull(),
  userId: varchar("user_id").notNull(),
  movementType: text("movement_type").notNull(), // in, out, adjustment
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  previousStock: decimal("previous_stock", { precision: 10, scale: 3 }).notNull(),
  newStock: decimal("new_stock", { precision: 10, scale: 3 }).notNull(),
  referenceId: varchar("reference_id"), // Links to sales_transactions, purchase_orders, etc.
  referenceType: text("reference_type"), // sale, purchase, adjustment
  notes: text("notes"),
  movementDate: timestamp("movement_date").defaultNow(),
});

// Price history table
export const priceHistory = pgTable("price_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  stationId: varchar("station_id").notNull(),
  oldPrice: decimal("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: decimal("new_price", { precision: 10, scale: 2 }).notNull(),
  effectiveDate: timestamp("effective_date").defaultNow(),
  userId: varchar("user_id").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Settings table
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull().unique(),
  taxEnabled: boolean("tax_enabled").default(false),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default('0'),
  currencyCode: currencyCodeEnum("currency_code").notNull().default('PKR'),
  companyName: text("company_name"),
  companyAddress: text("company_address"),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  receiptFooter: text("receipt_footer"),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pump management tables
export const pumps = pgTable("pumps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stationId: varchar("station_id").notNull(),
  name: text("name").notNull(),
  pumpNumber: text("pump_number").notNull(),
  productId: varchar("product_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pumpReadings = pgTable("pump_readings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pumpId: varchar("pump_id").notNull(),
  stationId: varchar("station_id").notNull(),
  userId: varchar("user_id").notNull(),
  productId: varchar("product_id").notNull(),
  readingDate: timestamp("reading_date").defaultNow(),
  openingReading: decimal("opening_reading", { precision: 10, scale: 3 }).notNull(),
  closingReading: decimal("closing_reading", { precision: 10, scale: 3 }).notNull(),
  totalSale: decimal("total_sale", { precision: 10, scale: 3 }).notNull(),
  shiftNumber: text("shift_number").notNull(),
  operatorName: text("operator_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  station: one(stations, { fields: [users.stationId], references: [stations.id] }),
  salesTransactions: many(salesTransactions),
  purchaseOrders: many(purchaseOrders),
  expenses: many(expenses),
  payments: many(payments),
  stockMovements: many(stockMovements),
  priceHistory: many(priceHistory),
}));

export const stationsRelations = relations(stations, ({ one, many }) => ({
  users: many(users),
  tanks: many(tanks),
  salesTransactions: many(salesTransactions),
  purchaseOrders: many(purchaseOrders),
  expenses: many(expenses),
  payments: many(payments),
  stockMovements: many(stockMovements),
  priceHistory: many(priceHistory),
  settings: one(settings, { fields: [stations.id], references: [settings.stationId] }),
  pumps: many(pumps),
  pumpReadings: many(pumpReadings),
}));

export const productsRelations = relations(products, ({ many }) => ({
  tanks: many(tanks),
  salesTransactionItems: many(salesTransactionItems),
  purchaseOrderItems: many(purchaseOrderItems),
  priceHistory: many(priceHistory),
}));

export const tanksRelations = relations(tanks, ({ one, many }) => ({
  station: one(stations, { fields: [tanks.stationId], references: [stations.id] }),
  product: one(products, { fields: [tanks.productId], references: [products.id] }),
  salesTransactionItems: many(salesTransactionItems),
  purchaseOrderItems: many(purchaseOrderItems),
  stockMovements: many(stockMovements),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  salesTransactions: many(salesTransactions),
  payments: many(payments),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchaseOrders: many(purchaseOrders),
  payments: many(payments),
}));

export const salesTransactionsRelations = relations(salesTransactions, ({ one, many }) => ({
  station: one(stations, { fields: [salesTransactions.stationId], references: [stations.id] }),
  customer: one(customers, { fields: [salesTransactions.customerId], references: [customers.id] }),
  user: one(users, { fields: [salesTransactions.userId], references: [users.id] }),
  items: many(salesTransactionItems),
}));

export const salesTransactionItemsRelations = relations(salesTransactionItems, ({ one }) => ({
  transaction: one(salesTransactions, { fields: [salesTransactionItems.transactionId], references: [salesTransactions.id] }),
  product: one(products, { fields: [salesTransactionItems.productId], references: [products.id] }),
  tank: one(tanks, { fields: [salesTransactionItems.tankId], references: [tanks.id] }),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  station: one(stations, { fields: [purchaseOrders.stationId], references: [stations.id] }),
  supplier: one(suppliers, { fields: [purchaseOrders.supplierId], references: [suppliers.id] }),
  user: one(users, { fields: [purchaseOrders.userId], references: [users.id] }),
  items: many(purchaseOrderItems),
}));

export const purchaseOrderItemsRelations = relations(purchaseOrderItems, ({ one }) => ({
  order: one(purchaseOrders, { fields: [purchaseOrderItems.orderId], references: [purchaseOrders.id] }),
  product: one(products, { fields: [purchaseOrderItems.productId], references: [products.id] }),
  tank: one(tanks, { fields: [purchaseOrderItems.tankId], references: [tanks.id] }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  station: one(stations, { fields: [expenses.stationId], references: [stations.id] }),
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  station: one(stations, { fields: [payments.stationId], references: [stations.id] }),
  user: one(users, { fields: [payments.userId], references: [users.id] }),
  customer: one(customers, { fields: [payments.customerId], references: [customers.id] }),
  supplier: one(suppliers, { fields: [payments.supplierId], references: [suppliers.id] }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  tank: one(tanks, { fields: [stockMovements.tankId], references: [tanks.id] }),
  station: one(stations, { fields: [stockMovements.stationId], references: [stations.id] }),
  user: one(users, { fields: [stockMovements.userId], references: [users.id] }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  product: one(products, { fields: [priceHistory.productId], references: [products.id] }),
  station: one(stations, { fields: [priceHistory.stationId], references: [stations.id] }),
  user: one(users, { fields: [priceHistory.userId], references: [users.id] }),
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  station: one(stations, { fields: [settings.stationId], references: [stations.id] }),
}));

export const pumpsRelations = relations(pumps, ({ one, many }) => ({
  station: one(stations, { fields: [pumps.stationId], references: [stations.id] }),
  product: one(products, { fields: [pumps.productId], references: [products.id] }),
  pumpReadings: many(pumpReadings),
}));

export const pumpReadingsRelations = relations(pumpReadings, ({ one }) => ({
  pump: one(pumps, { fields: [pumpReadings.pumpId], references: [pumps.id] }),
  station: one(stations, { fields: [pumpReadings.stationId], references: [stations.id] }),
  user: one(users, { fields: [pumpReadings.userId], references: [users.id] }),
  product: one(products, { fields: [pumpReadings.productId], references: [products.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStationSchema = createInsertSchema(stations).omit({ id: true, createdAt: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, taxRate: true });
export const insertTankSchema = createInsertSchema(tanks).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export const insertSalesTransactionSchema = createInsertSchema(salesTransactions).omit({ id: true, createdAt: true });
export const insertSalesTransactionItemSchema = createInsertSchema(salesTransactionItems).omit({ id: true, createdAt: true });
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({ id: true, createdAt: true }).extend({
  orderDate: z.coerce.date(),
  expectedDeliveryDate: z.coerce.date().optional(),
  actualDeliveryDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
});
export const insertPurchaseOrderItemSchema = createInsertSchema(purchaseOrderItems).omit({ id: true, createdAt: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true }).extend({
  expenseDate: z.coerce.date(),
});
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertStockMovementSchema = createInsertSchema(stockMovements);
export const insertPriceHistorySchema = createInsertSchema(priceHistory).omit({ id: true, createdAt: true });
export const insertSettingsSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPumpSchema = createInsertSchema(pumps).omit({ id: true, createdAt: true });
export const insertPumpReadingSchema = createInsertSchema(pumpReadings).omit({ id: true, createdAt: true }).extend({
  readingDate: z.coerce.date(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type Station = typeof stations.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Tank = typeof tanks.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type SalesTransaction = typeof salesTransactions.$inferSelect;
export type SalesTransactionItem = typeof salesTransactionItems.$inferSelect;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type PurchaseOrderItem = typeof purchaseOrderItems.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type PriceHistory = typeof priceHistory.$inferSelect;
export type Pump = typeof pumps.$inferSelect;
export type PumpReading = typeof pumpReadings.$inferSelect;
export type Settings = typeof settings.$inferSelect;