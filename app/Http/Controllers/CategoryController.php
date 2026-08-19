<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    public function index(): Response
    {
        return response(Category::orderBy('name')->get());
    }
}
