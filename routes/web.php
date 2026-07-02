<?php

use App\Http\Controllers\PublicFormController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/admin/forms')->name('home');

Route::get('/f/{form:slug}', [PublicFormController::class, 'show'])->name('public-form.show');
Route::post('/f/{form:slug}', [PublicFormController::class, 'store'])->name('public-form.store');
Route::get('/f/{form:slug}/gracias', [PublicFormController::class, 'thankYou'])->name('public-form.thank-you');
