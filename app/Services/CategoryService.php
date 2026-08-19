<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Validation\ValidationException;

class CategoryService
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Category
    {
        $category = Category::create([
            'name' => $data['name'],
            'monthly_budget_cents' => $data['monthly_budget_cents'],
        ]);

        // spent_cents is set by the DB's column default, not by this insert,
        // so the in-memory model needs a refresh to reflect it (it would
        // otherwise report null until the next fetch).
        return $category->refresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Category $category, array $data): Category
    {
        $category->update([
            'name' => $data['name'],
            'monthly_budget_cents' => $data['monthly_budget_cents'],
        ]);

        return $category;
    }

    public function delete(Category $category): void
    {
        if ($category->expenses()->exists()) {
            throw ValidationException::withMessages([
                'category' => 'This category has expenses and cannot be deleted.',
            ]);
        }

        $category->delete();
    }
}
