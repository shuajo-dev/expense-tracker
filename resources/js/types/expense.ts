export interface Category {
    id: number;
    name: string;
    monthly_budget_cents: number;
    spent_cents: number;
}

export interface Expense {
    id: number;
    category_id: number;
    amount_cents: number;
    description: string;
    date: string;
    category?: Category;
}
