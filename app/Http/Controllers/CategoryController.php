<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class CategoryController extends Controller
{
    public function __construct(private readonly CategoryService $categories) {}

    public function index(Request $request): Response|InertiaResponse
    {
        $categories = Category::orderBy('name')->get();

        if ($request->wantsJson()) {
            return response($categories);
        }

        return Inertia::render('categories/index', ['categories' => $categories]);
    }

    public function store(StoreCategoryRequest $request): Response|RedirectResponse
    {
        $category = $this->categories->create($request->validated());

        if ($request->wantsJson()) {
            return response($category, 201);
        }

        return redirect()->route('categories.index');
    }

    public function update(UpdateCategoryRequest $request, Category $category): Response|RedirectResponse
    {
        $category = $this->categories->update($category, $request->validated());

        if ($request->wantsJson()) {
            return response($category);
        }

        return redirect()->route('categories.index');
    }

    public function destroy(Request $request, Category $category): Response|RedirectResponse
    {
        $this->categories->delete($category);

        if ($request->wantsJson()) {
            return response()->noContent();
        }

        return redirect()->route('categories.index');
    }
}
