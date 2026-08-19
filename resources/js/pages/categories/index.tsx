import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import CategoryForm from '@/components/category-form';
import ConfirmDialog from '@/components/confirm-dialog';
import MessageDialog from '@/components/message-dialog';
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
import { destroy, index } from '@/routes/categories';
import type { BreadcrumbItem, Category } from '@/types';

type CategoriesIndexProps = {
    categories: Category[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Categories', href: index() }];

export default function CategoriesIndex({ categories }: CategoriesIndexProps) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(
        null,
    );
    const [deleteError, setDeleteError] = useState<string | null>(null);

    function confirmDelete() {
        if (!deletingCategory) {
            return;
        }

        router.delete(destroy(deletingCategory.id).url, {
            preserveScroll: true,
            onError: (errors) => {
                if (errors.category) {
                    setDeleteError(errors.category);
                }
            },
        });
    }

    return (
        <>
            <Head title="Categories" />

            <div className="flex flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Categories</h1>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>Add category</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add category</DialogTitle>
                            </DialogHeader>
                            <CategoryForm
                                onSuccess={() => setCreateOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">
                                            Name
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Spent
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Budget
                                        </th>
                                        <th className="py-2 pr-4 font-medium" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.map((category) => (
                                        <tr
                                            key={category.id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2 pr-4">
                                                {category.name}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {formatCents(
                                                    category.spent_cents,
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 whitespace-nowrap">
                                                {formatCents(
                                                    category.monthly_budget_cents,
                                                )}
                                            </td>
                                            <td className="py-2 pr-4 text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setEditingCategory(
                                                            category,
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDeletingCategory(
                                                            category,
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {categories.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="py-6 text-center text-muted-foreground"
                                            >
                                                No categories yet.
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
                open={editingCategory !== null}
                onOpenChange={(open) => !open && setEditingCategory(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit category</DialogTitle>
                    </DialogHeader>
                    {editingCategory && (
                        <CategoryForm
                            category={editingCategory}
                            onSuccess={() => setEditingCategory(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deletingCategory !== null}
                onOpenChange={(open) => !open && setDeletingCategory(null)}
                title="Delete category"
                description={`Delete "${deletingCategory?.name}"? This cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={confirmDelete}
            />

            <MessageDialog
                open={deleteError !== null}
                onOpenChange={(open) => !open && setDeleteError(null)}
                title="Can't delete category"
                description={deleteError ?? ''}
            />
        </>
    );
}

CategoriesIndex.layout = { breadcrumbs };
