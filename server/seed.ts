import { storage } from "./storage";
import bcrypt from "bcrypt";
import { db } from "./db";
import { users, stations, products, tanks, customers } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedInitialData() {
  try {
    // Check if database already has data
    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    if (userCount.count > 0) {
      console.log("Database already seeded, skipping initial data creation");
      console.log("Adding comprehensive sample data for testing...");
      await seedSampleData(); // Add sample data even if users exist
      return;
    }

    console.log("Seeding initial data...");

    // 1. Create a station
    const station = await storage.createStation({
      name: "FuelFlow Station 1",
      address: "123 Main Street, Demo City",
      gstNumber: "GST123456789",
      licenseNumber: "LIC123456",
      contactPhone: "+1-234-567-8900",
      contactEmail: "station@fuelflow.com",
      defaultCurrency: "PKR",
      isActive: true
    });

    console.log("Created station:", station.name);

    // 2. Create products (fuel types)
    const petrolProduct = await storage.createProduct({
      name: "Petrol",
      category: "fuel",
      unit: "litre",
      currentPrice: "290.00",
      density: "0.740",
      hsnCode: "27101990",
      taxRate: "0.00",
      isActive: true
    });

    const dieselProduct = await storage.createProduct({
      name: "Diesel",
      category: "fuel", 
      unit: "litre",
      currentPrice: "280.00",
      density: "0.830",
      hsnCode: "27101110",
      taxRate: "0.00",
      isActive: true
    });

    console.log("Created products:", petrolProduct.name, dieselProduct.name);

    // 3. Create tanks
    const petrolTank = await storage.createTank({
      stationId: station.id,
      name: "Tank 1 - Petrol",
      productId: petrolProduct.id,
      capacity: "20000.00",
      currentStock: "12000.00",
      minimumLevel: "3000.00",
      status: "normal",
      lastRefillDate: new Date()
    });

    const dieselTank = await storage.createTank({
      stationId: station.id,
      name: "Tank 2 - Diesel", 
      productId: dieselProduct.id,
      capacity: "20000.00",
      currentStock: "4000.00", // Low stock to show alert
      minimumLevel: "3000.00",
      status: "low",
      lastRefillDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    });

    console.log("Created tanks:", petrolTank.name, dieselTank.name);

    // 4. Create demo users with hashed passwords
    const saltRounds = 10;

    const adminUser = await storage.createUser({
      username: "admin",
      password: await bcrypt.hash("admin123", saltRounds),
      fullName: "Admin User",
      role: "admin",
      stationId: station.id,
      isActive: true
    });

    const managerUser = await storage.createUser({
      username: "manager", 
      password: await bcrypt.hash("manager123", saltRounds),
      fullName: "Manager User",
      role: "manager",
      stationId: station.id,
      isActive: true
    });

    const cashierUser = await storage.createUser({
      username: "cashier",
      password: await bcrypt.hash("cashier123", saltRounds), 
      fullName: "Cashier User",
      role: "cashier",
      stationId: station.id,
      isActive: true
    });

    console.log("Created users:", adminUser.username, managerUser.username, cashierUser.username);

    // 5. Create some stock movements for realistic data
    await storage.createStockMovement({
      tankId: petrolTank.id,
      stationId: station.id,
      userId: adminUser.id,
      movementType: "in",
      quantity: "8000.00",
      previousStock: "4000.00",
      newStock: "12000.00",
      referenceType: "adjustment",
      notes: "Initial stock refill"
    });

    await storage.createStockMovement({
      tankId: dieselTank.id,
      stationId: station.id,
      userId: adminUser.id,
      movementType: "in", 
      quantity: "3000.00",
      previousStock: "1000.00",
      newStock: "4000.00",
      referenceType: "adjustment",
      notes: "Initial stock refill"
    });

    console.log("Created initial stock movements");

    // 6. Create sample customers for testing
    const customers = await Promise.all([
      storage.createCustomer({
        name: "Ahmed Transport Co.",
        contactPhone: "+92-300-1234567",
        contactEmail: "ahmed@transport.com",
        address: "123 Transport Street, Karachi",
        creditLimit: "50000.00",
        outstandingAmount: "15000.00",
        isActive: true
      }),
      storage.createCustomer({
        name: "Khan Logistics",
        contactPerson: "Muhammad Khan", 
        phone: "+92-321-7654321",
        email: "khan@logistics.com",
        address: "456 Logistics Avenue, Lahore",
        creditLimit: "75000.00",
        outstandingBalance: "8500.00",
        isActive: true
      }),
      storage.createCustomer({
        name: "City Bus Service",
        contactPerson: "Fatima Sheikh",
        phone: "+92-333-9876543", 
        email: "fatima@citybus.com",
        address: "789 Bus Terminal Road, Islamabad",
        creditLimit: "100000.00",
        outstandingBalance: "0.00",
        isActive: true
      }),
      storage.createCustomer({
        name: "Delivery Express",
        contactPerson: "Hassan Ahmed",
        phone: "+92-345-1122334",
        email: "hassan@delivery.com", 
        address: "321 Delivery Lane, Faisalabad",
        creditLimit: "25000.00",
        outstandingBalance: "5200.00",
        isActive: true
      })
    ]);
    console.log("Created customers:", customers.map(c => c.name).join(", "));

    // 7. Create sample suppliers
    const suppliers = await Promise.all([
      storage.createSupplier({
        name: "Pakistan State Oil (PSO)",
        contactPerson: "Ali Rahman",
        contactPhone: "+92-21-111222333",
        contactEmail: "ali@pso.com.pk",
        address: "PSO House, Clifton, Karachi",
        gstNumber: "PSO123456789",
        paymentTerms: "Net 30",
        isActive: true
      }),
      storage.createSupplier({
        name: "Shell Pakistan Limited",
        contactPerson: "Sara Khan", 
        contactPhone: "+92-21-444555666",
        contactEmail: "sara@shell.com.pk",
        address: "Shell Building, I.I. Chundrigar Road, Karachi",
        gstNumber: "SHELL987654321",
        paymentTerms: "Net 15",
        isActive: true
      }),
      storage.createSupplier({
        name: "Total PARCO Pakistan Ltd",
        contactPerson: "Omar Malik",
        contactPhone: "+92-21-777888999",
        contactEmail: "omar@totalparco.com.pk", 
        address: "PARCO Head Office, Karachi",
        gstNumber: "PARCO555444333",
        paymentTerms: "Net 45",
        isActive: true
      })
    ]);
    console.log("Created suppliers:", suppliers.map(s => s.name).join(", "));

    // 8. Create additional products
    const lubricantProduct = await storage.createProduct({
      name: "Engine Oil 10W-40",
      category: "lubricant", 
      unit: "litre",
      currentPrice: "1200.00",
      density: "0.850",
      hsnCode: "27101990",
      taxRate: "0.00",
      isActive: true
    });

    const additiveProduct = await storage.createProduct({
      name: "Fuel Additive",
      category: "additive",
      unit: "bottle",
      currentPrice: "350.00",
      hsnCode: "38112100",
      taxRate: "0.00",
      isActive: true
    });
    console.log("Created additional products:", lubricantProduct.name, additiveProduct.name);

    // 9. Create sample sales transactions with realistic data
    const salesTransactions = [];
    for (let i = 0; i < 15; i++) {
      const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
      const randomCashier = Math.random() > 0.5 ? cashierUser : managerUser;
      const daysAgo = Math.floor(Math.random() * 30); // Random date in last 30 days
      const transactionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Random fuel quantities between 50-500 liters
      const petrolQty = Math.random() > 0.5 ? (50 + Math.random() * 450).toFixed(2) : "0";
      const dieselQty = Math.random() > 0.5 ? (50 + Math.random() * 450).toFixed(2) : "0";
      
      const petrolAmount = parseFloat(petrolQty) * 290;
      const dieselAmount = parseFloat(dieselQty) * 280; 
      const subtotal = petrolAmount + dieselAmount;
      
      if (subtotal > 0) {
        const paymentMethods = ["cash", "card", "credit"];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        const transaction = await storage.createSalesTransaction({
          stationId: station.id,
          customerId: randomCustomer.id,
          userId: randomCashier.id,
          invoiceNumber: `INV-2024-${String(1000 + i).padStart(4, '0')}`,
          transactionDate: transactionDate,
          paymentMethod: paymentMethod as any,
          subtotal: subtotal.toFixed(2),
          taxAmount: "0.00",
          totalAmount: subtotal.toFixed(2),
          paidAmount: paymentMethod === "credit" ? "0.00" : subtotal.toFixed(2),
          outstandingAmount: paymentMethod === "credit" ? subtotal.toFixed(2) : "0.00",
          notes: `Fuel transaction - ${paymentMethod} payment`,
          currencyCode: "PKR"
        });
        
        // Create transaction items
        if (parseFloat(petrolQty) > 0) {
          await storage.createSalesTransactionItem({
            transactionId: transaction.id,
            productId: petrolProduct.id,
            tankId: petrolTank.id,
            quantity: petrolQty,
            unitPrice: "290.00",
            totalPrice: petrolAmount.toFixed(2)
          });
          
          // Create stock movement
          await storage.createStockMovement({
            tankId: petrolTank.id,
            stationId: station.id,
            userId: randomCashier.id,
            movementType: "out",
            quantity: petrolQty,
            previousStock: "0", // Will be calculated
            newStock: "0", // Will be calculated  
            referenceId: transaction.id,
            referenceType: "sale",
            notes: `Sale - Invoice ${transaction.invoiceNumber}`,
            movementDate: transactionDate
          });
        }
        
        if (parseFloat(dieselQty) > 0) {
          await storage.createSalesTransactionItem({
            transactionId: transaction.id,
            productId: dieselProduct.id,
            tankId: dieselTank.id,
            quantity: dieselQty,
            unitPrice: "280.00", 
            totalPrice: dieselAmount.toFixed(2)
          });
          
          // Create stock movement
          await storage.createStockMovement({
            tankId: dieselTank.id,
            stationId: station.id,
            userId: randomCashier.id,
            movementType: "out",
            quantity: dieselQty,
            previousStock: "0", // Will be calculated
            newStock: "0", // Will be calculated
            referenceId: transaction.id,
            referenceType: "sale", 
            notes: `Sale - Invoice ${transaction.invoiceNumber}`,
            movementDate: transactionDate
          });
        }
        
        salesTransactions.push(transaction);
      }
    }
    console.log(`Created ${salesTransactions.length} sample sales transactions`);

    // 10. Create sample purchase orders
    for (let i = 0; i < 8; i++) {
      const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const daysAgo = Math.floor(Math.random() * 60); // Random date in last 60 days
      const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const expectedDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const quantity = (5000 + Math.random() * 10000).toFixed(2);
      const unitPrice = Math.random() > 0.5 ? "275.00" : "265.00"; // Wholesale prices
      const totalAmount = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);
      
      const statuses = ["pending", "approved", "delivered", "cancelled"];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      await storage.createPurchaseOrder({
        stationId: station.id,
        supplierId: randomSupplier.id,
        userId: adminUser.id,
        orderNumber: `PO-2024-${String(2000 + i).padStart(4, '0')}`,
        orderDate: orderDate,
        expectedDeliveryDate: expectedDate,
        subtotal: totalAmount,
        taxAmount: "0.00",
        totalAmount: totalAmount,
        status: status as any,
        notes: `Bulk fuel order from ${randomSupplier.name}`,
        currencyCode: "PKR"
      });
    }
    console.log("Created 8 sample purchase orders");

    // 11. Create sample expenses
    const expenseCategories = ["maintenance", "utilities", "supplies", "insurance", "rent"];
    for (let i = 0; i < 12; i++) {
      const daysAgo = Math.floor(Math.random() * 90); // Random date in last 90 days
      const expenseDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const amount = (1000 + Math.random() * 15000).toFixed(2);
      
      await storage.createExpense({
        stationId: station.id,
        userId: adminUser.id,
        description: getExpenseDescription(category),
        category: category,
        amount: amount,
        expenseDate: expenseDate,
        paymentMethod: Math.random() > 0.5 ? "cash" : "card",
        receiptNumber: `RCP-${Date.now()}-${i}`
      });
    }
    console.log("Created 12 sample expense records");

    // 12. Create more stock movements for testing
    const movementTypes = ["in", "out", "adjustment", "audit"];
    for (let i = 0; i < 10; i++) {
      const randomTank = Math.random() > 0.5 ? petrolTank : dieselTank;
      const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
      const daysAgo = Math.floor(Math.random() * 45);
      const movementDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      let quantity = "0";
      if (movementType === "in") {
        quantity = (1000 + Math.random() * 5000).toFixed(2);
      } else if (movementType === "out") {
        quantity = (100 + Math.random() * 1000).toFixed(2);
      } else if (movementType === "adjustment") {
        quantity = ((Math.random() - 0.5) * 500).toFixed(2); // Can be negative
      } else if (movementType === "audit") {
        quantity = (3000 + Math.random() * 10000).toFixed(2);
      }
      
      await storage.createStockMovement({
        tankId: randomTank.id,
        stationId: station.id, 
        userId: adminUser.id,
        movementType: movementType as any,
        quantity: quantity,
        previousStock: "0", // Will be calculated
        newStock: "0", // Will be calculated
        referenceType: "manual",
        notes: `${movementType.charAt(0).toUpperCase() + movementType.slice(1)} - Sample data`,
        movementDate: movementDate
      });
    }
    console.log("Created 10 additional stock movements");

    console.log("✅ Comprehensive sample data seeding completed!");
    console.log("📊 Sample data includes:");
    console.log("- 4 customers with various credit balances");
    console.log("- 3 suppliers (PSO, Shell, Total PARCO)");
    console.log("- 15+ sales transactions over last 30 days");
    console.log("- 8 purchase orders with different statuses");
    console.log("- 12 expense records across different categories");
    console.log("- 10+ additional stock movements");
    console.log("- Additional products (lubricants, additives)");
    console.log("");
    console.log("🔐 Demo login credentials:");
    console.log("- Admin: admin / admin123");
    console.log("- Manager: manager / manager123");
    console.log("- Cashier: cashier / cashier123");

  } catch (error) {
    console.error("Error seeding sample data:", error);
    throw error;
  }
}

async function seedSampleData() {
  try {
    // Get existing entities
    const [station] = await db.select().from(stations);
    if (!station) {
      console.log("No station found, skipping sample data creation");
      return;
    }
    
    console.log("Adding sample data to existing station:", station.name);

    // Get existing users and products
    const allUsers = await db.select().from(users);
    const adminUser = allUsers.find(u => u.role === 'admin');
    const managerUser = allUsers.find(u => u.role === 'manager');  
    const cashierUser = allUsers.find(u => u.role === 'cashier');
    
    if (!adminUser || !managerUser || !cashierUser) {
      console.log("Required users not found, skipping sample data creation");
      return;
    }

    // Check if sample data already exists (to avoid duplicates)
    const existingCustomers = await db.select().from(customers);
    if (existingCustomers.length > 0) {
      console.log("Sample data already exists, skipping creation");
      return;
    }

    // Get existing products
    const allProducts = await db.select().from(products);
    const petrolProduct = allProducts.find(p => p.name === 'Petrol');
    const dieselProduct = allProducts.find(p => p.name === 'Diesel');
    
    if (!petrolProduct || !dieselProduct) {
      console.log("Required products not found, skipping sample data creation");
      return;
    }

    // Get existing tanks
    const allTanks = await db.select().from(tanks);
    const petrolTank = allTanks.find(t => t.productId === petrolProduct.id);
    const dieselTank = allTanks.find(t => t.productId === dieselProduct.id);
    
    if (!petrolTank || !dieselTank) {
      console.log("Required tanks not found, skipping sample data creation");
      return;
    }

    console.log("Creating comprehensive sample data...");

    // Create sample customers
    const testCustomers = await Promise.all([
      storage.createCustomer({
        name: "Ahmed Transport Co.",
        contactPerson: "Ahmed Ali",
        phone: "+92-300-1234567",
        email: "ahmed@transport.com",
        address: "123 Transport Street, Karachi",
        creditLimit: "50000.00",
        outstandingBalance: "15000.00",
        isActive: true
      }),
      storage.createCustomer({
        name: "Khan Logistics",
        contactPerson: "Muhammad Khan", 
        phone: "+92-321-7654321",
        email: "khan@logistics.com",
        address: "456 Logistics Avenue, Lahore",
        creditLimit: "75000.00",
        outstandingBalance: "8500.00",
        isActive: true
      }),
      storage.createCustomer({
        name: "City Bus Service",
        contactPerson: "Fatima Sheikh",
        phone: "+92-333-9876543", 
        email: "fatima@citybus.com",
        address: "789 Bus Terminal Road, Islamabad",
        creditLimit: "100000.00",
        outstandingBalance: "0.00",
        isActive: true
      })
    ]);
    console.log("✅ Created", testCustomers.length, "sample customers");

    // Create sample suppliers
    const testSuppliers = await Promise.all([
      storage.createSupplier({
        name: "Pakistan State Oil (PSO)",
        contactPerson: "Ali Rahman",
        phone: "+92-21-111222333",
        email: "ali@pso.com.pk",
        address: "PSO House, Clifton, Karachi",
        taxId: "PSO123456789",
        paymentTerms: "Net 30",
        isActive: true
      }),
      storage.createSupplier({
        name: "Shell Pakistan Limited",
        contactPerson: "Sara Khan", 
        phone: "+92-21-444555666",
        email: "sara@shell.com.pk",
        address: "Shell Building, I.I. Chundrigar Road, Karachi",
        taxId: "SHELL987654321", 
        paymentTerms: "Net 15",
        isActive: true
      })
    ]);
    console.log("✅ Created", testSuppliers.length, "sample suppliers");

    // Create sample sales transactions
    let transactionCount = 0;
    for (let i = 0; i < 10; i++) {
      const randomCustomer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
      const randomCashier = Math.random() > 0.5 ? cashierUser : managerUser;
      const daysAgo = Math.floor(Math.random() * 20);
      const transactionDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      const fuelQty = (50 + Math.random() * 300).toFixed(2);
      const product = Math.random() > 0.5 ? petrolProduct : dieselProduct;
      const tank = product.id === petrolProduct.id ? petrolTank : dieselTank;
      const unitPrice = product.id === petrolProduct.id ? "290.00" : "280.00";
      const totalAmount = parseFloat(fuelQty) * parseFloat(unitPrice);
      
      const paymentMethod = ["cash", "card", "credit"][Math.floor(Math.random() * 3)];
      
      const transaction = await storage.createSalesTransaction({
        stationId: station.id,
        customerId: randomCustomer.id,
        userId: randomCashier.id,
        invoiceNumber: `INV-TEST-${String(1000 + i).padStart(4, '0')}`,
        transactionDate: transactionDate,
        paymentMethod: paymentMethod as any,
        subtotal: totalAmount.toFixed(2),
        taxAmount: "0.00",
        totalAmount: totalAmount.toFixed(2),
        paidAmount: paymentMethod === "credit" ? "0.00" : totalAmount.toFixed(2),
        outstandingAmount: paymentMethod === "credit" ? totalAmount.toFixed(2) : "0.00",
        paymentStatus: paymentMethod === "credit" ? "pending" : "paid",
        notes: `Sample fuel transaction - ${paymentMethod} payment`,
        currencyCode: "PKR"
      });
      
      await storage.createSalesTransactionItem({
        transactionId: transaction.id,
        productId: product.id,
        tankId: tank.id,
        quantity: fuelQty,
        unitPrice: unitPrice,
        totalPrice: totalAmount.toFixed(2)
      });
      
      transactionCount++;
    }
    console.log("✅ Created", transactionCount, "sample sales transactions");

    // Create sample expenses
    const expenseCategories = ["maintenance", "utilities", "supplies"];
    for (let i = 0; i < 6; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const expenseDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const amount = (2000 + Math.random() * 8000).toFixed(2);
      
      await storage.createExpense({
        stationId: station.id,
        userId: managerUser.id, // Add required userId field
        description: getExpenseDescription(category),
        category: category,
        amount: amount,
        expenseDate: expenseDate,
        paymentMethod: Math.random() > 0.5 ? "cash" : "card",
        receiptNumber: `RCP-TEST-${Date.now()}-${i}`,
        notes: `Sample ${category} expense`
      });
    }
    console.log("✅ Created 6 sample expense records");

    // Create sample purchase orders
    for (let i = 0; i < 4; i++) {
      const randomSupplier = testSuppliers[Math.floor(Math.random() * testSuppliers.length)];
      const daysAgo = Math.floor(Math.random() * 40);
      const orderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const expectedDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const quantity = (3000 + Math.random() * 7000).toFixed(2);
      const unitPrice = "275.00";
      const totalAmount = (parseFloat(quantity) * parseFloat(unitPrice)).toFixed(2);
      
      const status = ["pending", "approved", "delivered"][Math.floor(Math.random() * 3)];
      
      await storage.createPurchaseOrder({
        stationId: station.id,
        supplierId: randomSupplier.id,
        userId: adminUser.id,
        orderNumber: `PO-TEST-${String(3000 + i).padStart(4, '0')}`,
        orderDate: orderDate,
        expectedDeliveryDate: expectedDate,
        productId: Math.random() > 0.5 ? petrolProduct.id : dieselProduct.id,
        quantity: quantity,
        unitPrice: unitPrice,
        subtotal: totalAmount,
        taxAmount: "0.00",
        totalAmount: totalAmount,
        status: status as any,
        notes: `Sample bulk fuel order from ${randomSupplier.name}`,
        currencyCode: "PKR"
      });
    }
    console.log("✅ Created 4 sample purchase orders");
    
    console.log("🎉 Comprehensive sample data added successfully!");
    console.log("📊 Sample data includes customers, suppliers, sales, expenses, and purchase orders");
    console.log("🧪 Perfect for testing all application features!");
  } catch (error) {
    console.error("Error adding sample data:", error);
  }
}

function getExpenseDescription(category: string): string {
  const descriptions = {
    maintenance: ["Pump servicing", "Tank cleaning", "Equipment repair", "Preventive maintenance"],
    utilities: ["Electricity bill", "Water bill", "Internet charges", "Phone bill"],
    supplies: ["Office supplies", "Cleaning materials", "Safety equipment", "Stationery"],
    insurance: ["Vehicle insurance", "Property insurance", "Liability coverage", "Equipment insurance"],
    rent: ["Office rent", "Equipment lease", "Land rent", "Storage rent"]
  };
  
  const categoryDescriptions = descriptions[category as keyof typeof descriptions] || ["General expense"];
  return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
}