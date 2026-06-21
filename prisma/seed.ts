import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'System Administrator',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  })
  console.log('Created admin user:', admin.email)

  // Create sample companies
  const companyA = await prisma.company.upsert({
    where: { id: 'company-a' },
    update: {},
    create: {
      id: 'company-a',
      name: 'ABC Technologies Pvt Ltd',
      gstin: '27AABCU9603R1ZX',
      pan: 'AABCU9603R',
      address: '123 Tech Park, Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      bankName: 'HDFC Bank',
      bankAccount: '12345678901234',
      bankIfsc: 'HDFC0001234',
      invoicePrefix: 'ABC-INV',
      quotationPrefix: 'ABC-QOT',
    },
  })

  const companyB = await prisma.company.upsert({
    where: { id: 'company-b' },
    update: {},
    create: {
      id: 'company-b',
      name: 'XYZ Infosystems Pvt Ltd',
      gstin: '29AABCX1234Y1Z5',
      pan: 'AABCX1234Y',
      address: '456 IT Hub, Bangalore',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      bankName: 'ICICI Bank',
      bankAccount: '98765432109876',
      bankIfsc: 'ICIC0005678',
      invoicePrefix: 'XYZ-INV',
      quotationPrefix: 'XYZ-QOT',
    },
  })
  console.log('Created companies:', companyA.name, companyB.name)

  // Create sample customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Global Enterprises Ltd',
      industry: 'Manufacturing',
      gst: '27AABCG1234D1Z5',
      pan: 'AABCG1234D',
      billingAddress: '789 Industrial Area, Pune',
      shippingAddress: '789 Industrial Area, Pune',
      status: 'ACTIVE',
      tags: ['enterprise', 'premium'],
      companyId: companyA.id,
      locations: {
        create: [
          { name: 'Head Office', address: '789 Industrial Area, Pune', city: 'Pune', state: 'Maharashtra', isHeadOffice: true },
          { name: 'Branch 1', address: '101 Tech Park, Pune', city: 'Pune', state: 'Maharashtra' },
        ],
      },
      contactPersons: {
        create: [
          { name: 'Rajesh Kumar', email: 'rajesh@global.com', phone: '+91-9876543210', designation: 'IT Manager', isPrimary: true },
          { name: 'Priya Sharma', email: 'priya@global.com', phone: '+91-9876543211', designation: 'Finance Manager' },
        ],
      },
    },
  })

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Smart Solutions Inc',
      industry: 'IT Services',
      gst: '29AABCS5678E1Z2',
      pan: 'AABCS5678E',
      billingAddress: '202 Software Park, Bangalore',
      shippingAddress: '202 Software Park, Bangalore',
      status: 'ACTIVE',
      tags: ['it', 'startup'],
      companyId: companyB.id,
      locations: {
        create: [
          { name: 'Head Office', address: '202 Software Park, Bangalore', city: 'Bangalore', state: 'Karnataka', isHeadOffice: true },
        ],
      },
      contactPersons: {
        create: [
          { name: 'Anita Desai', email: 'anita@smart.com', phone: '+91-8765432109', designation: 'CTO', isPrimary: true },
        ],
      },
    },
  })
  console.log('Created customers:', customer1.name, customer2.name)

  // Create sample assets
  const asset1 = await prisma.asset.create({
    data: {
      name: 'Dell PowerEdge Server',
      serialNumber: 'SN123456789',
      model: 'PowerEdge R740',
      oem: 'Dell',
      assetType: 'SERVER',
      purchaseDate: new Date('2024-01-15'),
      installationDate: new Date('2024-01-20'),
      warrantyStart: new Date('2024-01-15'),
      warrantyEnd: new Date('2027-01-14'),
      amcStart: new Date('2024-01-15'),
      amcEnd: new Date('2025-01-14'),
      status: 'ACTIVE',
      customerId: customer1.id,
      companyId: companyA.id,
    },
  })

  const asset2 = await prisma.asset.create({
    data: {
      name: 'Fortinet Firewall',
      serialNumber: 'SN987654321',
      model: 'FortiGate 100F',
      oem: 'Fortinet',
      assetType: 'FIREWALL',
      purchaseDate: new Date('2024-03-10'),
      installationDate: new Date('2024-03-15'),
      warrantyStart: new Date('2024-03-10'),
      warrantyEnd: new Date('2027-03-09'),
      status: 'ACTIVE',
      customerId: customer2.id,
      companyId: companyB.id,
    },
  })
  console.log('Created assets:', asset1.name, asset2.name)

  // Create sample contracts
  const contract1 = await prisma.contract.create({
    data: {
      contractNumber: 'CNT-2024-001',
      contractType: 'YEARLY_AMC',
      status: 'ACTIVE',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      value: '250000.00',
      billingFrequency: 'QUARTERLY',
      customerId: customer1.id,
      companyId: companyA.id,
      assets: { connect: { id: asset1.id } },
    },
  })
  console.log('Created contract:', contract1.contractNumber)

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      ticketNumber: 'TKT-2024-001',
      title: 'Server slow performance',
      description: 'The main server is experiencing slow response times during peak hours.',
      status: 'OPEN',
      priority: 'HIGH',
      customerId: customer1.id,
      companyId: companyA.id,
      assetId: asset1.id,
    },
  })
  console.log('Created ticket:', ticket1.ticketNumber)

  // Create sample invoice
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'ABC-INV-001',
      invoiceType: 'TAX_INVOICE',
      status: 'SENT',
      issueDate: new Date('2024-06-01'),
      dueDate: new Date('2024-06-30'),
      subtotal: '100000.00',
      taxAmount: '18000.00',
      totalAmount: '118000.00',
      customerId: customer1.id,
      companyId: companyA.id,
      contractId: contract1.id,
      items: {
        create: [
          { description: 'Q2 AMC - Server Maintenance', quantity: 1, unitPrice: '50000.00', taxRate: '18', total: '59000.00' },
          { description: 'Q2 AMC - Network Support', quantity: 1, unitPrice: '50000.00', taxRate: '18', total: '59000.00' },
        ],
      },
    },
  })
  console.log('Created invoice:', invoice1.invoiceNumber)

  // Create sample quotation
  const quotation1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'ABC-QOT-001',
      status: 'SENT',
      subtotal: '150000.00',
      taxAmount: '27000.00',
      totalAmount: '177000.00',
      validUntil: new Date('2024-12-31'),
      customerId: customer2.id,
      companyId: companyA.id,
      items: {
        create: [
          { description: 'Server Installation & Configuration', quantity: 1, unitPrice: '100000.00', taxRate: '18', total: '118000.00', itemType: 'IMPLEMENTATION' },
          { description: 'Annual AMC - 2 Servers', quantity: 1, unitPrice: '50000.00', taxRate: '18', total: '59000.00', itemType: 'AMC' },
        ],
      },
    },
  })
  console.log('Created quotation:', quotation1.quotationNumber)

  // Create sample implementation
  const implementation1 = await prisma.implementation.create({
    data: {
      title: 'Server Infrastructure Setup',
      description: 'Installed 2 Dell servers, 1 firewall, and 20 thin clients for the new office.',
      implementDate: new Date('2024-02-15'),
      engineerName: 'Rahul Sharma',
      customerId: customer1.id,
      companyId: companyA.id,
      assets: {
        create: [
          { quantity: 2, description: 'Dell PowerEdge Servers', assetId: asset1.id },
          { quantity: 1, description: 'Fortinet Firewall' },
        ],
      },
    },
  })
  console.log('Created implementation:', implementation1.title)

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
