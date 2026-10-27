# PayDesk - Student Tuition & Debtors Tracker

A lightweight web app for tracking student tuition fees, payments, and monthly debtors.

## 1. Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)

## 2. Install & Run

Clone the repository and install dependencies:

```bash
git clone https://github.com/saidmukhammedov/paydesk.git
cd paydesk
npm install
```

Optional: seed realistic sample data:
```bash
npm run seed
```

Start the application:
```bash
npm start
```

The web interface will be available at `http://localhost:3000`.

## 3. Environment Configuration

The app works with defaults out of the box. Optional environment variables:

- `PORT` - HTTP server port (defaults to `3000`)
- `DB_PATH` - Path to local SQLite file (defaults to `data/learning_center.db`)
- `POSTGRES_URL` / `DATABASE_URL` - PostgreSQL connection string (used when deployed to Vercel Postgres)
- `NODE_ENV` - Runtime environment (`development`, `test`, `production`)

## 4. API Endpoints

### Students

#### `GET /students`
Lists all students. Supports optional query filters `search` (name or phone) and `group`.

Example response:
```json
[
  {
    "id": 1,
    "full_name": "Elena Rostova",
    "phone_number": "+1 (555) 234-5678",
    "group_name": "Web Development A",
    "monthly_fee": 150.00
  }
]
```

#### `GET /students/:id`
Returns a single student by ID. Returns 404 if not found.

#### `POST /students`
Creates a new student record.

Request body:
```json
{
  "full_name": "Marcus Vance",
  "phone_number": "+1 (555) 876-5432",
  "group_name": "Web Development A",
  "monthly_fee": 150.00
}
```

Response (201):
```json
{
  "id": 2,
  "full_name": "Marcus Vance",
  "phone_number": "+1 (555) 876-5432",
  "group_name": "Web Development A",
  "monthly_fee": 150.00
}
```

#### `PUT /students/:id`
Updates an existing student's details.

Request body:
```json
{
  "group_name": "Web Development B",
  "monthly_fee": 175.00
}
```

#### `DELETE /students/:id`
Deletes a student and cascades to delete all their recorded payments.

Response (200):
```json
{
  "success": true,
  "message": "Student with ID 2 and all associated payment records were deleted successfully."
}
```

---

### Payments

#### `POST /payments`
Records a payment for a student.

Request body:
```json
{
  "student_id": 1,
  "amount": 75.00,
  "payment_date": "2026-10-15"
}
```

Response (201):
```json
{
  "id": 1,
  "student_id": 1,
  "amount": 75.00,
  "payment_date": "2026-10-15"
}
```

#### `GET /students/:id/payments`
Returns all payments for a student, ordered by payment date descending.

Example response:
```json
[
  {
    "id": 2,
    "student_id": 1,
    "amount": 50.00,
    "payment_date": "2026-10-12"
  },
  {
    "id": 1,
    "student_id": 1,
    "amount": 100.00,
    "payment_date": "2026-10-05"
  }
]
```

---

### Monthly Debtors

#### `GET /debtors?month=YYYY-MM`
Returns students whose payments for the requested month are strictly less than their monthly fee. Students who paid in full or overpaid are excluded.

Example request:
`GET /debtors?month=2026-10`

Example response:
```json
[
  {
    "id": 2,
    "full_name": "Marcus Vance",
    "phone_number": "+1 (555) 876-5432",
    "group_name": "Web Development A",
    "monthly_fee": 150.00,
    "total_paid": 50.00,
    "debt": 100.00
  }
]
```

Missing or invalid `month` query parameter returns 400:
```json
{
  "error": "Query parameter \"month\" is required and must be in YYYY-MM format."
}
```

## 5. Automated Tests

Run the test suite using Node.js's built-in test runner:

```bash
npm test
```

Tests run against an isolated in-memory database and cover:
- Student CRUD operations and validation errors
- Payment creation, history, and input checks
- Nonexistent student ID error handling
- Debtor calculations (zero payments, partial, exact, overpayment, multiple installments, cross-month isolation)
- Invalid `month` parameter rejection
- Monetary precision and calendar date edge cases

## 6. Improvements with One Additional Week

1. **Tuition fee history & effective dates**: Currently, updating a student's fee changes it for all past and future calculations. Adding effective date ranges (`effective_from`, `effective_to`) would ensure historical debtor reports use the fee agreed upon at that specific time.
2. **Report & receipt export (CSV / PDF)**: Add options to export monthly debtor reports as CSV files and generate printable receipts for individual payments.
3. **Authentication & basic roles**: Implement session-based login distinguishing view-only accounts (teachers) from administrative accounts (accountants/admins).
4. **Automated reminder notifications**: Add email or SMS reminders sent automatically to debtors on scheduled dates.
