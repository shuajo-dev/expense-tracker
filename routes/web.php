<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ExpenseController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::resource('expenses', ExpenseController::class)->except(['create', 'edit']);
});

require __DIR__.'/settings.php';
