import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ConfirmDialog from '@/components/confirm-dialog';
import ExpenseForm from '@/components/expense-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatCents } from '@/lib/money';
import { cn } from '@/lib/utils';
import { destroy, index } from '@/routes/expenses';
import type { BreadcrumbItem, Category, Expense } from '@/types';

type ExpensesIndexProps = {
    expenses: Expense[];
    categories: Category[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Expenses', href: index() }];

export default function ExpensesIndex({
    expenses,
    categories,
}: ExpensesIndexProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [deletingExpense, setDeletingExpense] = useState<Expense | null>(
        null,
    );

    const stats = useMemo(() => {
        const totalSpent = categories.reduce(
            (sum, c) => sum + c.spent_cents,
            0,
        );
        const totalBudget = categories.reduce(
            (sum, c) => sum + c.monthly_budget_cents,
            0,
        );

        return {
            totalSpent,
            totalBudget,
            remaining: totalBudget - totalSpent,
            count: expenses.length,
        };
    }, [expenses, categories]);

    function confirmDelete() {
        if (!deletingExpense) {
            return;
        }

        router.delete(destroy(deletingExpense.id).url, {
            preserveScroll: true,
        });
    }

    return (
        <>
            <Head title="Expenses" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Expenses</h1>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Add expense</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add expense</DialogTitle>
                            </DialogHeader>
                            <ExpenseForm
                                categories={categories}
                                onSuccess={() => setCreateOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total spent"
                        value={formatCents(stats.totalSpent)}
                    />
                    <StatCard
                        label="Total budget"
                        value={formatCents(stats.totalBudget)}
                    />
                    <StatCard
                        label="Remaining"
                        value={formatCents(stats.remaining)}
                        tone={stats.remaining < 0 ? 'negative' : 'default'}
                    />
                    <StatCard
                        label="Total expenses"
                        value={String(stats.count)}
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Budgets by category</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {categories.map((category) => (
                            <BudgetBar key={category.id} category={category} />
                        ))}
                        {categories.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No categories yet.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>All expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">
                                            Date
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Description
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Category
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Amount
                                        </th>
                                        <th className="py-2 pr-4 font-medium" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((expense) => (
                                        <tr
                                            key={expense.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {expense.date}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {expense.description}
                                            </td>
                                            <td className="py-2 pr-4">
                                                {expense.category?.name}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {formatCents(
                                                    expense.amount_cents,
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditingExpense(
                                                            expense,
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDeletingExpense(
                                                            expense,
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {expenses.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-6 text-center text-muted-foreground"
                                            >
                                                No expenses yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog
                open={editingExpense !== null}
                onOpenChange={(open) => !open && setEditingExpense(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit expense</DialogTitle>
                    </DialogHeader>
                    {editingExpense && (
                        <ExpenseForm
                            categories={categories}
                            expense={editingExpense}
                            onSuccess={() => setEditingExpense(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deletingExpense !== null}
                onOpenChange={(open) => !open && setDeletingExpense(null)}
                title="Delete expense"
                description={`Delete "${deletingExpense?.description}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
            />
        </>
    );
}

ExpensesIndex.layout = { breadcrumbs };

function StatCard({
    label,
    value,
    tone = 'default',
}: {
    label: string;
    value: string;
    tone?: 'default' | 'negative';
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p
                    className={cn(
                        'text-2xl font-semibold',
                        tone === 'negative' && 'text-destructive',
                    )}
                >
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

function BudgetBar({ category }: { category: Category }) {
    const percent =
        category.monthly_budget_cents === 0
            ? 0
            : Math.min(
                  100,
                  Math.round(
                      (category.spent_cents / category.monthly_budget_cents) *
                          100,
                  ),
              );
    const overBudget = category.spent_cents > category.monthly_budget_cents;

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{category.name}</span>
                <span
                    className={cn(
                        'text-muted-foreground',
                        overBudget && 'text-destructive',
                    )}
                >
                    {formatCents(category.spent_cents)} /{' '}
                    {formatCents(category.monthly_budget_cents)}
                </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        'h-full rounded-full',
                        overBudget ? 'bg-destructive' : 'bg-primary',
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
