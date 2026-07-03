<?php

use App\Http\Controllers\Admin\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Admin\CampaignBoardController;
use App\Http\Controllers\Admin\CampaignController;
use App\Http\Controllers\Admin\EmployeeComparisonController;
use App\Http\Controllers\Admin\FormController;
use App\Http\Controllers\Admin\ResultBoardController;
use App\Http\Controllers\Admin\ResultController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AuthenticatedSessionController::class, 'create'])->name('admin.login');
    Route::post('/admin/login', [AuthenticatedSessionController::class, 'store'])->name('admin.login.store');
});

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::resource('forms', FormController::class)->except('show');

    Route::get('campaigns', [CampaignBoardController::class, 'index'])->name('campaigns.index');
    Route::get('results', [ResultBoardController::class, 'index'])->name('results.index');
    Route::resource('users', UserController::class)->except('show');

    Route::get('forms/{form}/campaigns', [CampaignController::class, 'index'])->name('forms.campaigns.index');
    Route::post('forms/{form}/campaigns', [CampaignController::class, 'store'])->name('forms.campaigns.store');
    Route::post('campaigns/{campaign}/close', [CampaignController::class, 'close'])->name('campaigns.close');
    Route::post('campaigns/{campaign}/reopen', [CampaignController::class, 'reopen'])->name('campaigns.reopen');

    Route::get('campaigns/{campaign}/results', [ResultController::class, 'index'])->name('campaigns.results');
    Route::get('submissions/{submission}', [ResultController::class, 'show'])->name('submissions.show');
    Route::patch('submissions/{submission}/email', [ResultController::class, 'updateEmail'])->name('submissions.update-email');
    Route::delete('submissions/{submission}', [ResultController::class, 'destroy'])->name('submissions.destroy');

    Route::get('forms/{form}/employees', [EmployeeComparisonController::class, 'index'])->name('forms.employees.index');
    Route::get('forms/{form}/employees/compare', [EmployeeComparisonController::class, 'show'])->name('forms.employees.show');
});
