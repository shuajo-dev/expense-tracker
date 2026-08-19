<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Expense;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class ExpenseService
{
    /**
     * Create an expense idempotently and atomically increment the owning
     * category's spent_cents in the same transaction.
     *
     * @param  array<string, mixed>  $data
     * @return array{expense: Expense, created: bool}
     */
    public function create(array $data, ?string $idempotencyKey): array
    {
        if ($idempotencyKey !== null) {
            $existing = Expense::where('idempotency_key', $idempotencyKey)->first();

            if ($existing !== null) {
                return ['expense' => $existing, 'created' => false];
            }
        }

        try {
            $expense = DB::transaction(function () use ($data, $idempotencyKey) {
                $category = Category::query()->lockForUpdate()->findOrFail((int) $data['category_id']);

                $expense = Expense::create([
                    'category_id' => $category->id,
                    'amount_cents' => $data['amount_cents'],
                    'description' => $data['description'],
                    'date' => $data['date'],
                    'idempotency_key' => $idempotencyKey,
                ]);

                $category->increment('spent_cents', $data['amount_cents']);

                return $expense;
            });

            return ['expense' => $expense, 'created' => true];
        } catch (QueryException $e) {
            // Two requests can both pass the pre-check above before either
            // commits (classic idempotency-key race). The unique index on
            // idempotency_key is the real guard: whichever request loses
            // the race hits it here and returns the winner's row instead
            // of a duplicate.
            if ($idempotencyKey !== null && $this->isUniqueConstraintViolation($e)) {
                return ['expense' => Expense::where('idempotency_key', $idempotencyKey)->firstOrFail(), 'created' => false];
            }

            throw $e;
        }
    }

    /**
     * Update an expense, keeping affected categories' spent_cents in sync
     * with the change (including moving the amount between categories if
     * category_id changed).
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Expense $expense, array $data): Expense
    {
        return DB::transaction(function () use ($expense, $data) {
            $oldCategoryId = $expense->category_id;
            $newCategoryId = $data['category_id'];

            // Lock every category involved in a fixed (ascending id) order
            // so two concurrent updates touching the same pair of
            // categories can never deadlock by locking them in opposite
            // order.
            $categories = Category::query()
                ->whereIn('id', collect([$oldCategoryId, $newCategoryId])->unique())
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $oldCategory = $categories[$oldCategoryId];
            $newCategory = $categories[$newCategoryId];
            $oldAmount = $expense->amount_cents;

            $expense->fill($data)->save();

            if ($oldCategoryId === $newCategoryId) {
                $delta = $data['amount_cents'] - $oldAmount;

                if ($delta !== 0) {
                    $oldCategory->increment('spent_cents', $delta);
                }
            } else {
                $oldCategory->decrement('spent_cents', $oldAmount);
                $newCategory->increment('spent_cents', $data['amount_cents']);
            }

            return $expense;
        });
    }

    public function delete(Expense $expense): void
    {
        DB::transaction(function () use ($expense) {
            $category = Category::query()->lockForUpdate()->findOrFail($expense->category_id);

            $expense->delete();

            $category->decrement('spent_cents', $expense->amount_cents);
        });
    }

    private function isUniqueConstraintViolation(QueryException $e): bool
    {
        return $e->getCode() === '23000';
    }
}
