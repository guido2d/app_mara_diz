<?php

use App\Models\Evaluation;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\StressSignalsSeeder;
use Database\Seeders\SymptomsDiseasesSeeder;
use Database\Seeders\WorkSelfPerceptionSeeder;

it('seeds at least one scored evaluation with questions and options', function () {
    $this->seed(StressSignalsSeeder::class);

    $evaluation = Evaluation::with('questions.options')->first();

    expect($evaluation)->not->toBeNull()
        ->and($evaluation->questions)->not->toBeEmpty()
        ->and($evaluation->isScored())->toBeTrue()
        ->and($evaluation->maxPossiblePoints())->toBeGreaterThan(0);
});

it('seeds classifying evaluations as not scored', function () {
    $this->seed(SymptomsDiseasesSeeder::class);
    $this->seed(WorkSelfPerceptionSeeder::class);

    expect(Evaluation::where('slug', 'sintomas-o-enfermedades')->firstOrFail()->isScored())->toBeFalse()
        ->and(Evaluation::where('slug', 'autopercepciones-del-trabajo')->firstOrFail()->isScored())->toBeFalse();
});

it('seeds an admin user', function () {
    $this->seed(AdminUserSeeder::class);
    expect(User::where('email', 'admin@bienestar.test')->exists())->toBeTrue();
});
