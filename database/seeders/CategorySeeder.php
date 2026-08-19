<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['name' => 'Groceries', 'monthly_budget_cents' => 50_000],
            ['name' => 'Rent', 'monthly_budget_cents' => 150_000],
            ['name' => 'Utilities', 'monthly_budget_cents' => 20_000],
            ['name' => 'Transportation', 'monthly_budget_cents' => 15_000],
            ['name' => 'Dining Out', 'monthly_budget_cents' => 25_000],
            ['name' => 'Entertainment', 'monthly_budget_cents' => 10_000],
            ['name' => 'Healthcare', 'monthly_budget_cents' => 20_000],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(['name' => $category['name']], $category);
        }
    }
}
