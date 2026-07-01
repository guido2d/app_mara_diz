<?php

use App\Models\Evaluation;
use App\Models\User;
use App\Services\RangeCoverageValidator;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\StressSignalsSeeder;

it('seeds at least one evaluation with valid range coverage', function () {
    $this->seed(StressSignalsSeeder::class);

    $evaluation = Evaluation::with(['questions.options', 'scoreRanges'])->first();
    expect($evaluation)->not->toBeNull()
        ->and($evaluation->questions)->not->toBeEmpty()
        ->and($evaluation->scoreRanges)->not->toBeEmpty();

    $ranges = $evaluation->scoreRanges->map(fn ($r) => ['min_points' => $r->min_points, 'max_points' => $r->max_points])->all();
    (new RangeCoverageValidator)->validate($evaluation->maxPossiblePoints(), $ranges);
})->throwsNoExceptions();

it('seeds an admin user', function () {
    $this->seed(AdminUserSeeder::class);
    expect(User::where('email', 'admin@bienestar.test')->exists())->toBeTrue();
});
