import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { centsToDollarInput, dollarsToCents } from '@/lib/money';
import { store, update } from '@/routes/expenses';
import type { Category, Expense } from '@/types';

type ExpenseFormData = {
    category_id: string;
    amount: string;
    description: string;
    date: string;
};

type ExpenseFormProps = {
    categories: Category[];
    expense?: Expense;
    onSuccess?: () => void;
};

export default function ExpenseForm({
    categories,
    expense,
    onSuccess,
}: ExpenseFormProps) {
    const isEditing = expense !== undefined;

    // A fresh key per mount, regenerated after every successful create, so a
    // genuine double-click/network-retry of the same submission reuses the
    // same key (and is deduped server-side), while each new expense the user
    // adds gets its own key.
    const [idempotencyKey, setIdempotencyKey] = useState(() =>
        crypto.randomUUID(),
    );
    const [amountError, setAmountError] = useState<string>();

    const form = useForm<ExpenseFormData>({
        category_id: expense
            ? String(expense.category_id)
            : String(categories[0]?.id ?? ''),
        amount: expense ? centsToDollarInput(expense.amount_cents) : '',
        description: expense?.description ?? '',
        date: expense?.date ?? new Date().toISOString().slice(0, 10),
    });

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault();

        const amountCents = dollarsToCents(form.data.amount);

        if (amountCents === null || amountCents <= 0) {
            setAmountError('Enter a valid amount greater than 0, like 12.50.');

            return;
        }

        setAmountError(undefined);

        form.transform((data) => ({
            category_id: Number(data.category_id),
            amount_cents: amountCents,
            description: data.description,
            date: data.date,
        }));

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                if (!isEditing) {
                    form.reset();
                    setIdempotencyKey(crypto.randomUUID());
                }

                onSuccess?.();
            },
        };

        if (isEditing) {
            form.put(update(expense.id).url, options);
        } else {
            form.post(store().url, {
                ...options,
                headers: { 'Idempotency-Key': idempotencyKey },
            });
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="category_id">Category</Label>
                <Select
                    value={form.data.category_id}
                    onValueChange={(value) =>
                        form.setData('category_id', value)
                    }
                >
                    <SelectTrigger id="category_id" className="w-full">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={String(category.id)}
                            >
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={form.errors.category_id} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                    id="amount"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={form.data.amount}
                    onChange={(event) =>
                        form.setData('amount', event.target.value)
                    }
                />
                <InputError
                    message={
                        amountError ??
                        (form.errors as Record<string, string>).amount_cents
                    }
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={form.data.description}
                    onChange={(event) =>
                        form.setData('description', event.target.value)
                    }
                />
                <InputError message={form.errors.description} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                    id="date"
                    type="date"
                    value={form.data.date}
                    onChange={(event) =>
                        form.setData('date', event.target.value)
                    }
                />
                <InputError message={form.errors.date} />
            </div>

            <Button type="submit" disabled={form.processing} className="w-full">
                {isEditing ? 'Save changes' : 'Add expense'}
            </Button>
        </form>
    );
}
