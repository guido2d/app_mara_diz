<?php

use App\Http\Controllers\Admin\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Admin\CampaignController;
use App\Http\Controllers\Admin\FormController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ResultController;
use App\Http\Controllers\Admin\ScoreRangeController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/admin/login', [AuthenticatedSessionController::class, 'create'])->name('admin.login');
    Route::post('/admin/login', [AuthenticatedSessionController::class, 'store'])->name('admin.login.store');
});

Route::middleware('auth')->prefix('admin')->name('admin.')->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::resource('forms', FormController::class)->except('show');

    Route::get('forms/{form}/campaigns', [CampaignController::class, 'index'])->name('forms.campaigns.index');
    Route::post('forms/{form}/campaigns', [CampaignController::class, 'store'])->name('forms.campaigns.store');
    Route::post('campaigns/{campaign}/close', [CampaignController::class, 'close'])->name('campaigns.close');

    Route::get('evaluations/{evaluation}/ranges', [ScoreRangeController::class, 'edit'])->name('evaluations.ranges.edit');
    Route::put('evaluations/{evaluation}/ranges', [ScoreRangeController::class, 'update'])->name('evaluations.ranges.update');

    Route::get('campaigns/{campaign}/results', [ResultController::class, 'index'])->name('campaigns.results');
    Route::get('submissions/{submission}', [ResultController::class, 'show'])->name('submissions.show');

    Route::get('campaigns/{campaign}/report', [ReportController::class, 'show'])->name('campaigns.report');
});
