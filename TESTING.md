# Clinic Run - Testing Environment

This document describes the testing environment setup for performance testing the Clinic Run application.

## Overview

The testing environment includes:
- A separate test database (`clinic-test.db`)
- Performance data seeder that generates large amounts of realistic test data
- Automated setup scripts for easy environment management

## Quick Start

### 1. Install Dependencies
```bash
bun install
```

### 2. Setup Test Environment
```bash
bun run test:setup
```

### 3. Run Test Environment
```bash
bun run dev:test:all
```

This will:
- Create the test database
- Run migrations
- Seed performance data (may take several minutes)
- Start both frontend and backend in test mode

### 3. Verify Setup
Check that the test database was created and seeded:
```bash
ls -lh clinic-test.db
```

## Available Commands

### Test Database Management
```bash
# Setup complete test environment (database + performance data)
bun run test:setup

# Reset and reseed test database
bun run test:db:reset

# Run performance test setup (alias for test:db:reset)
bun run test:perf

# Generate test database schema
bun run test:db:generate

# Run test database migrations
bun run test:db:migrate

# Seed performance data only
bun run test:db:seed
```

### Database Statistics
After seeding, you can check the database statistics:
```bash
sqlite3 clinic-test.db "SELECT COUNT(*) FROM patients;"
sqlite3 clinic-test.db "SELECT COUNT(*) FROM appointments;"
# ... check other tables as needed
```

## Test Data Configuration

The performance seeder generates the following amounts of data:

| Table | Records | Description |
|-------|---------|-------------|
| patients | 3,000 | Patient records with realistic demographics |
| doctors | 30 | Medical practitioners with login accounts |
| admins | 10 | Administrators with login accounts |
| appointments | 5,000 | Scheduled and completed appointments |
| medical_records | 3,000 | Visit records with diagnoses and treatments |
| medications | 1,000 | Pharmacy inventory items |
| prescriptions | 2,500 | Medication prescriptions |
| invoices | 2,000 | Billing records |
| lab_tests | 1,500 | Laboratory test orders and results |

**Total: ~18,000 records**

## Data Characteristics

### Realistic Data Generation
- **Patient Data**: 3,000 patients with diverse demographics, medical histories, allergies, emergency contacts
- **Medical Records**: 3,000 visit records with vital signs, diagnoses, treatments, and clinical notes
- **Appointments**: 5,000 scheduled/completed appointments across 30 doctors
- **Medications**: 1,000 pharmacy inventory items with stock levels and pricing
- **Prescriptions**: 2,500 medication prescriptions linked to medical records
- **Invoices**: 2,000 billing records with itemized charges and payment status
- **Lab Tests**: 1,500 laboratory test orders with completion status and results

### Test Data Characteristics
- **Patient IDs**: Generated as P000001, P000002, etc. (6-digit format)
- **Doctor Accounts**: 30 doctors with emails like `dr.john.doe@clinic.local` (password: `doctor123`)
- **Admin Accounts**: 10 admins with emails like `admin.jane.smith@clinic.local` (password: `admin123`)
- **Date Range**: Appointments and records span from 2023-2025
- **Status Distribution**: Mixed status values (scheduled/completed/cancelled for appointments, paid/pending/overdue for invoices)
- **Geographic Data**: Realistic addresses and phone numbers for all patients
- **Medical Data**: Common diagnoses like Hypertension, Diabetes, Common Cold, etc.

### Performance Considerations
- Foreign key relationships are properly maintained across all tables
- Data distribution simulates real-world clinic usage patterns
- Random but realistic timestamps across a 2-year period
- Varied status values (active/inactive, paid/pending, etc.)
- Balanced data ratios (e.g., not all appointments are completed)

## Using Test Data in Application

### Environment Variables
You can set environment variables to control database connections:

```bash
# For test database
DB_FILE_NAME="./clinic-test.db"

# For production database
DB_FILE_NAME="./clinic.db"
```

### Application Performance
- Test data loading times with large datasets
- Monitor memory usage during bulk operations
- Test search and filtering performance
- Validate pagination with 10k+ records

### Database File Location
- Test database: `./clinic-test.db`
- Production database: `./clinic.db`

### Cleanup
To remove test database:
```bash
rm clinic-test.db
```

## Best Practices

1. **Always use test database for performance testing**
2. **Reset test data before each performance test run**
3. **Monitor database file size growth**
4. **Test with realistic data distributions**
5. **Use proper indexing for frequently queried columns**

## Contributing

When adding new features that affect database performance:
1. Update the performance seeder if new tables are added
2. Test with the full dataset before committing
3. Document any performance considerations
4. Update this README with new testing procedures