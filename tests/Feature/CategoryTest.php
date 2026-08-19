<?php

use App\Models\Category;
use App\Models\Expense;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create());
});

test('categories can be listed', function () {
    Category::factory()->count(3)->create();

    $this->getJson('/categories')->assertOk()->assertJsonCount(3);
});

test('a category can be created, updated, and deleted', function () {
    // Create
    $create = $this->postJson('/categories', [
        'name' => 'Groceries',
        'monthly_budget_cents' => 50_000,
    ])->assertCreated();

    $categoryId = $create->json('id');
    expect(Category::count())->toBe(1);
    expect($create->json('spent_cents'))->toBe(0);

    // Update
    $this->putJson("/categories/{$categoryId}", [
        'name' => 'Groceries & Household',
        'monthly_budget_cents' => 60_000,
    ])->assertOk()->assertJson([
        'name' => 'Groceries & Household',
        'monthly_budget_cents' => 60_000,
    ]);

    // Delete
    $this->deleteJson("/categories/{$categoryId}")->assertNoContent();
    expect(Category::find($categoryId))->toBeNull();
});

test('creating a category ignores a client-supplied spent_cents', function () {
    $response = $this->postJson('/categories', [
        'name' => 'Groceries',
        'monthly_budget_cents' => 50_000,
        'spent_cents' => 99_999,
    ])->assertCreated();

    expect($response->json('spent_cents'))->toBe(0);
});

test('deleting a category with expenses is blocked', function () {
    $category = Category::factory()->create();
    Expense::factory()->create(['category_id' => $category->id]);

    $this->deleteJson("/categories/{$category->id}")->assertUnprocessable();

    expect(Category::find($category->id))->not->toBeNull();
});

test('category name must be unique', function () {
    Category::factory()->create(['name' => 'Groceries']);

    $this->postJson('/categories', [
        'name' => 'Groceries',
        'monthly_budget_cents' => 10_000,
    ])->assertUnprocessable();
});
