# Expense Tracker

A small expense tracking module built on the Laravel React starter kit
(Laravel + Inertia + React + TypeScript + Tailwind + shadcn/ui, SQLite,
Pest). Tracks expenses against per-category monthly budgets.

## Running it locally

Requirements: PHP 8.3+, Composer, Node 18+, npm.

```bash
composer install
npm install

cp .env.example .env
php artisan key:generate

touch database/database.sqlite
php artisan migrate
php artisan db:seed  

composer run dev  
```

Then visit `http://localhost:8000` and log in with the seeded user:

- **Email:** `test@example.com`
- **Password:** `password`

## Running the tests

```bash
php artisan test
```

## Why it's built this way

**Money is integer cents.** This is because Floats can't represent decimals like `0.1` exactly, so repeated arithmetic on money drifts over time. Cents avoid that in the database, backend, and frontend input parsing. Floats only appear for final display formatting.

**Idempotent expense creation.** `POST /expenses` accepts an `Idempotency-Key` header. A retried request with the same key returns the original expense instead of creating a duplicate. A unique DB constraint on the key is the real guarantee — not just an app-level check, which alone would be racy under concurrent requests.

**Atomic budget updates.** Creating an expense locks the category row (`lockForUpdate()`) and increments `spent_cents` in the same transaction as the insert. This prevents two concurrent requests from both reading the same total and one silently overwriting the other's update. It's kept synchronous so the lock and the update never get separated.

**Category Deletion is blocked if an Expense exists.** Deletion is rejected at the service level, with a DB constraint as a backup. The reason for this is so that we would avoid wiping out all expenses for the category. 

**Controllers are thin, all business logic lives in the service.** Form Requests validate input. Services own transactions and business rules. Controllers just call a service and pick a response format.

**Left out on purpose:** multi-tenancy, roles/permissions, pagination, queued jobs.
