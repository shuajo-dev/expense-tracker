import { useForm } from '@inertiajs/react';
import type React from 'react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { centsToDollarInput, dollarsToCents } from '@/lib/money';
import { store, update } from '@/routes/categories';
import type { Category } from '@/types';

type CategoryFormData = {
    name: string;
    budget: string;
};

type CategoryFormProps = {
    category?: Category;
    onSuccess?: () => void;
};

export default function CategoryForm({
    category,
    onSuccess,
}: CategoryFormProps) {
    const isEditing = category !== undefined;
    const [budgetError, setBudgetError] = useState<string>();

    const form = useForm<CategoryFormData>({
        name: category?.name ?? '',
        budget: category
            ? centsToDollarInput(category.monthly_budget_cents)
            : '',
    });

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const budgetCents = dollarsToCents(form.data.budget);

        if (budgetCents === null || budgetCents < 0) {
            setBudgetError('Enter a valid budget, like 500 or 500.00.');

            return;
        }

        setBudgetError(undefined);

        form.transform((data) => ({
            name: data.name,
            monthly_budget_cents: budgetCents,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (!isEditing) {
                    form.reset();
                }

                onSuccess?.();
            },
        };

        if (isEditing) {
            form.put(update(category.id).url, options);
        } else {
            form.post(store().url, options);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    value={form.data.name}
                    onChange={(event) =>
                        form.setData('name', event.target.value)
                    }
                />
                <InputError message={form.errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="budget">Monthly budget</Label>
                <Input
                    id="budget"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.data.budget}
                    onChange={(event) =>
                        form.setData('budget', event.target.value)
                    }
                />
                <InputError
                    message={
                        budgetError ??
                        (form.errors as Record<string, string>)
                            .monthly_budget_cents
                    }
                />
            </div>

            <Button type="submit" disabled={form.processing} className="w-full">
                {isEditing ? 'Save changes' : 'Add category'}
            </Button>
        </form>
    );
}
