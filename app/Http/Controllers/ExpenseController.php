<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Category;
use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ExpenseController extends Controller
{
    public function __construct(private readonly ExpenseService $expenses) {}

    public function index(): InertiaResponse
    {
        return Inertia::render('expenses/index', [
            'expenses' => Expense::with('category')->orderByDesc('date')->orderByDesc('id')->get(),
            'categories' => Category::orderBy('name')->get(),
        ]);
    }

    public function store(StoreExpenseRequest $request): Response|RedirectResponse
    {
        ['expense' => $expense, 'created' => $created] = $this->expenses->create(
            $request->validated(),
            $request->header('Idempotency-Key'),
        );

        if ($request->wantsJson()) {
            return response($expense->fresh(), $created ? 201 : 200);
        }

        return redirect()->route('expenses.index');
    }

    public function show(Request $request, Expense $expense): Response|RedirectResponse
    {
        if ($request->wantsJson()) {
            return response($expense);
        }

        return redirect()->route('expenses.index');
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): Response|RedirectResponse
    {
        $expense = $this->expenses->update($expense, $request->validated());

        if ($request->wantsJson()) {
            return response($expense);
        }

        return redirect()->route('expenses.index');
    }

    public function destroy(Request $request, Expense $expense): Response|RedirectResponse
    {
        $this->expenses->delete($expense);

        if ($request->wantsJson()) {
            return response()->noContent();
        }

        return redirect()->route('expenses.index');
    }
}
