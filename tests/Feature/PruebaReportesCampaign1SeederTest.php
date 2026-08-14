<?php

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Models\SubmissionAnswer;
use App\Models\SubmissionResult;
use Database\Seeders\HealthyHabitsSeeder;
use Database\Seeders\PhysicalSymptomsSeeder;
use Database\Seeders\PruebaReportesCampaign1Seeder;
use Database\Seeders\ReportQuestionsSeeder;
use Database\Seeders\StressSignalsSeeder;
use Database\Seeders\SymptomsDiseasesSeeder;
use Database\Seeders\WorkSelfPerceptionSeeder;

beforeEach(function () {
    $this->seed(StressSignalsSeeder::class);
    $this->seed(PhysicalSymptomsSeeder::class);
    $this->seed(HealthyHabitsSeeder::class);
    $this->seed(WorkSelfPerceptionSeeder::class);
    $this->seed(SymptomsDiseasesSeeder::class);
    $this->seed(ReportQuestionsSeeder::class);
});

it('fills the first campaign of the prueba reportes form with the whole roster', function () {
    $this->seed(PruebaReportesCampaign1Seeder::class);

    $form = Form::where('slug', 'prueba-reportes')->firstOrFail();
    $campaign = $form->campaigns()->firstOrFail();

    expect($form->evaluations)->toHaveCount(5)
        ->and($campaign->name)->toBe('Campaña 1 · Marzo 2026')
        ->and($campaign->isOpen())->toBeFalse()
        ->and($campaign->submissions()->count())->toBe(count(PruebaReportesCampaign1Seeder::EMPLOYEES))
        ->and(Submission::query()->distinct()->count('work_email'))->toBe($campaign->submissions()->count());
});

it('answers every scored question of every person and stores their totals', function () {
    $this->seed(PruebaReportesCampaign1Seeder::class);

    $form = Form::where('slug', 'prueba-reportes')->firstOrFail();
    $scoredEvaluations = $form->evaluations->filter->isScored();
    $scoredQuestions = $form->evaluations
        ->flatMap->questions
        ->filter(fn ($question) => $question->type->isScored());

    $submission = Submission::with('answers', 'results')->firstOrFail();

    expect($submission->answers->whereNotNull('option_points'))->toHaveCount($scoredQuestions->count())
        ->and($submission->results)->toHaveCount($scoredEvaluations->count())
        ->and($submission->results->sum('total_points'))->toBeGreaterThan(0)
        ->and(SubmissionAnswer::whereNotNull('value_text')->exists())->toBeTrue();
});

it('spreads the totals so the report has something to average', function () {
    $this->seed(PruebaReportesCampaign1Seeder::class);

    $psychic = Evaluation::where('slug', 'senales-de-estres')->firstOrFail();
    $totals = SubmissionResult::where('evaluation_id', $psychic->id)->pluck('total_points');

    expect($totals->unique()->count())->toBeGreaterThan(5)
        ->and($totals->max())->toBeLessThanOrEqual($psychic->maxPossiblePoints());
});

it('regenerates the same data instead of duplicating it when run twice', function () {
    $this->seed(PruebaReportesCampaign1Seeder::class);
    $before = SubmissionResult::sum('total_points');

    $this->seed(PruebaReportesCampaign1Seeder::class);

    expect(Campaign::count())->toBe(1)
        ->and(Submission::count())->toBe(count(PruebaReportesCampaign1Seeder::EMPLOYEES))
        ->and(SubmissionResult::sum('total_points'))->toBe($before);
});
