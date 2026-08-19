<?php

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

// --- Idempotent creation -------------------------------------------------

test('posting the same Idempotency-Key twice creates exactly one expense', function () {
    $category = Category::factory()->create(['monthly_budget_cents' => 100_000, 'spent_cents' => 0]);

    $payload = [
        'category_id' => $category->id,
        'amount_cents' => 1_500,
        'description' => 'Coffee',
        'date' => '2026-08-19',
    ];

    $first = $this->postJson('/expenses', $payload, ['Idempotency-Key' => 'key-123']);
    $second = $this->postJson('/expenses', $payload, ['Idempotency-Key' => 'key-123']);

    $first->assertCreated();
    $second->assertOk(); // 200, not 201 — nothing new was created on replay

    expect(Expense::count())->toBe(1);
    expect($first->json('id'))->toBe($second->json('id'));
    expect($second->json('amount_cents'))->toBe(1_500);

    $category->refresh();
    expect($category->spent_cents)->toBe(1_500); // only incremented once
});

test('two different Idempotency-Keys create two separate expenses', function () {
    $category = Category::factory()->create(['spent_cents' => 0]);

    $this->postJson('/expenses', [
        'category_id' => $category->id,
        'amount_cents' => 1_000,
        'description' => 'One',
        'date' => '2026-08-19',
    ], ['Idempotency-Key' => 'key-a'])->assertCreated();

    $this->postJson('/expenses', [
        'category_id' => $category->id,
        'amount_cents' => 2_000,
        'description' => 'Two',
        'date' => '2026-08-19',
    ], ['Idempotency-Key' => 'key-b'])->assertCreated();

    expect(Expense::count())->toBe(2);
    expect($category->refresh()->spent_cents)->toBe(3_000);
});

// --- Atomic budget increment ---------------------------------------------

test('spent_cents accumulates correctly across many expenses for the same category', function () {
    $category = Category::factory()->create(['spent_cents' => 0]);

    $amounts = [500, 1_250, 3_000, 750, 10_000];

    foreach ($amounts as $i => $amount) {
        $this->postJson('/expenses', [
            'category_id' => $category->id,
            'amount_cents' => $amount,
            'description' => "Expense {$i}",
            'date' => '2026-08-19',
        ], ['Idempotency-Key' => "key-{$i}"])->assertCreated();
    }

    expect(Expense::count())->toBe(count($amounts));
    expect($category->refresh()->spent_cents)->toBe(array_sum($amounts));
});

test('creating an expense against a nonexistent category fails without side effects', function () {
    $this->postJson('/expenses', [
        'category_id' => 999_999,
        'amount_cents' => 1_000,
        'description' => 'Orphan',
        'date' => '2026-08-19',
    ], ['Idempotency-Key' => 'orphan-key'])->assertUnprocessable();

    expect(Expense::count())->toBe(0);
});

// --- Standard CRUD contract ----------------------------------------------

test('an expense can be created, read, updated, and deleted', function () {
    $category = Category::factory()->create(['spent_cents' => 0]);

    // Create
    $create = $this->postJson('/expenses', [
        'category_id' => $category->id,
        'amount_cents' => 2_000,
        'description' => 'Groceries',
        'date' => '2026-08-19',
    ], ['Idempotency-Key' => 'crud-key'])->assertCreated();

    $expenseId = $create->json('id');
    expect($category->refresh()->spent_cents)->toBe(2_000);

    // Read
    $this->getJson("/expenses/{$expenseId}")
        ->assertOk()
        ->assertJson([
            'id' => $expenseId,
            'amount_cents' => 2_000,
            'description' => 'Groceries',
        ]);

    // Update — changing the amount must keep spent_cents consistent
    $this->putJson("/expenses/{$expenseId}", [
        'category_id' => $category->id,
        'amount_cents' => 3_500,
        'description' => 'Groceries (corrected)',
        'date' => '2026-08-19',
    ])->assertOk()
        ->assertJson(['amount_cents' => 3_500]);

    expect($category->refresh()->spent_cents)->toBe(3_500);

    // Delete — must remove the row and back out its contribution to spent_cents
    $this->deleteJson("/expenses/{$expenseId}")->assertNoContent();

    expect(Expense::find($expenseId))->toBeNull();
    expect($category->refresh()->spent_cents)->toBe(0);
});

test('categories can be listed read-only', function () {
    Category::factory()->count(3)->create();

    $this->getJson('/categories')->assertOk()->assertJsonCount(3);
});
