<?php

use App\Http\Controllers\PublicFormController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('/f/{form:slug}', [PublicFormController::class, 'show'])->name('public-form.show');
