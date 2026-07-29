<?php

use App\Enums\QuestionType;
use App\Enums\ReportMetric;
use App\Models\Evaluation;
use App\Models\Question;
use App\Models\User;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\HealthyHabitsSeeder;
use Database\Seeders\PhysicalSymptomsSeeder;
use Database\Seeders\ReportQuestionsSeeder;
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

it('flags the twelve psychic symptom questions for the report in the requested order', function () {
    $this->seed(StressSignalsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    $evaluation = Evaluation::where('slug', 'senales-de-estres')->firstOrFail();
    $positions = $evaluation->questions()->inReport()->pluck('position');

    expect($positions->all())->toBe([1, 3, 4, 6, 12, 16, 19, 18, 20, 21, 22, 23])
        ->and(Question::whereNotNull('report_position')->count())->toBe(12);
});

it('flags the ten physical symptom questions for the report in the requested order', function () {
    $this->seed(PhysicalSymptomsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    $evaluation = Evaluation::where('slug', 'sintomas-fisicos')->firstOrFail();
    $positions = $evaluation->questions()->inReport()->pluck('position');

    expect($positions->all())->toBe([1, 2, 3, 5, 6, 8, 9, 10, 11, 12])
        ->and(Question::whereNotNull('report_position')->count())->toBe(10);
});

it('flags the ten healthy habit questions for the report in the requested order', function () {
    $this->seed(HealthyHabitsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    $evaluation = Evaluation::where('slug', 'conductas-habitos-saludables')->firstOrFail();
    $positions = $evaluation->questions()->inReport()->pluck('position');

    expect($positions->all())->toBe([1, 3, 4, 7, 8, 12, 13, 17, 18, 19])
        ->and(Question::whereNotNull('report_position')->count())->toBe(10);
});

it('flags every yes/no question of symptoms and diseases for the report, leaving the free-text ones out', function () {
    $this->seed(SymptomsDiseasesSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    $evaluation = Evaluation::where('slug', 'sintomas-o-enfermedades')->firstOrFail();
    $positions = $evaluation->questions()->inReport()->pluck('position');

    expect($positions->all())->toBe([1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14, 16])
        ->and(Question::whereNotNull('report_position')->count())->toBe(14)
        ->and($evaluation->questions()->inReport()->pluck('type')->unique()->all())->toBe([QuestionType::Radio]);
});

it('reports symptoms and diseases as a percentage of affirmative answers', function () {
    $this->seed(SymptomsDiseasesSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    expect(Evaluation::where('slug', 'sintomas-o-enfermedades')->firstOrFail()->reportMetric())->toBe(ReportMetric::YesRate);
});

it('marks healthy habits as an evaluation where more points is better', function () {
    $this->seed(HealthyHabitsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    expect(Evaluation::where('slug', 'conductas-habitos-saludables')->firstOrFail()->lowerIsBetter())->toBeFalse()
        ->and(Evaluation::where('slug', 'senales-de-estres')->first()?->lowerIsBetter())->toBeNull();
});

it('reports healthy habits as a percentage of positive answers', function () {
    $this->seed(HealthyHabitsSeeder::class);
    $this->seed(StressSignalsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    expect(Evaluation::where('slug', 'conductas-habitos-saludables')->firstOrFail()->reportMetric())->toBe(ReportMetric::PositiveRate)
        ->and(Evaluation::where('slug', 'senales-de-estres')->firstOrFail()->reportMetric())->toBe(ReportMetric::Average);
});

it('can be seeded twice without changing the result', function () {
    $this->seed(StressSignalsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);

    expect(Question::whereNotNull('report_position')->count())->toBe(12);
});
