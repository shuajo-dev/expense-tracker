<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => Category::factory(),
            'amount_cents' => fake()->numberBetween(100, 20_000),
            'description' => fake()->sentence(3),
            'date' => fake()->date(),
            'idempotency_key' => null,
        ];
    }
}
