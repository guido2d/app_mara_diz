<?php

use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Models\SubmissionResult;
use App\Models\User;
use Database\Seeders\HealthyHabitsSeeder;
use Database\Seeders\PhysicalSymptomsSeeder;
use Database\Seeders\PruebaReportesCampaign1Seeder;
use Database\Seeders\PruebaReportesCampaign2Seeder;
use Database\Seeders\PruebaReportesCampaignSeeder;
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
    $this->seed(PruebaReportesCampaign1Seeder::class);
    $this->seed(PruebaReportesCampaign2Seeder::class);
});

/** Average total points of one evaluation in one campaign. */
function averageTotal(int $campaignId, string $evaluationSlug): float
{
    $evaluation = Evaluation::where('slug', $evaluationSlug)->firstOrFail();

    return (float) SubmissionResult::query()
        ->join('submissions', 'submissions.id', '=', 'submission_results.submission_id')
        ->where('submissions.campaign_id', $campaignId)
        ->where('submission_results.evaluation_id', $evaluation->id)
        ->avg('total_points');
}

it('answers the second campaign with the same people minus the absent ones', function () {
    $form = Form::where('slug', 'prueba-reportes')->firstOrFail();
    [$first, $second] = $form->campaigns()->reorder('id')->get()->all();

    $roster = count(PruebaReportesCampaignSeeder::EMPLOYEES);

    expect($form->campaigns()->count())->toBe(2)
        ->and($first->submissions()->count())->toBe($roster)
        ->and($second->submissions()->count())->toBe($roster - 4)
        ->and($second->isOpen())->toBeTrue();

    // Every email of the second campaign also exists in the first one, so the
    // comparison always has two takes of the same person.
    $firstEmails = $first->submissions()->pluck('work_email');
    $secondEmails = $second->submissions()->pluck('work_email');

    expect($secondEmails->diff($firstEmails))->toBeEmpty()
        ->and($firstEmails->diff($secondEmails))->toHaveCount(4);
});

it('shows the staff improving between both campaigns', function () {
    $form = Form::where('slug', 'prueba-reportes')->firstOrFail();
    [$first, $second] = $form->campaigns()->reorder('id')->get()->all();

    // Fewer symptoms and more healthy habits: the report must read as "mejoró"
    // in both directions of the lower_is_better flag.
    expect(averageTotal($second->id, 'senales-de-estres'))->toBeLessThan(averageTotal($first->id, 'senales-de-estres'))
        ->and(averageTotal($second->id, 'sintomas-fisicos'))->toBeLessThan(averageTotal($first->id, 'sintomas-fisicos'))
        ->and(averageTotal($second->id, 'conductas-habitos-saludables'))->toBeGreaterThan(averageTotal($first->id, 'conductas-habitos-saludables'));
});

it('feeds the report with an average per campaign for every question', function () {
    $form = Form::where('slug', 'prueba-reportes')->firstOrFail();

    $this->actingAs(User::factory()->create())
        ->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/show')
            ->has('campaigns', 2)
            ->has('evaluations.0.questions', 12)
            ->where('evaluations.0.questions.0.values.0.answers', count(PruebaReportesCampaignSeeder::EMPLOYEES))
            ->where('evaluations.0.questions.0.values.1.answers', count(PruebaReportesCampaignSeeder::EMPLOYEES) - 4)
            ->whereNot('evaluations.0.totals.0.average', null)
            ->whereNot('evaluations.0.totals.1.average', null)
        );
});

it('compares one employee campaign by campaign', function () {
    $form = Form::where('slug', 'prueba-reportes')->firstOrFail();
    $email = Submission::query()->orderBy('id')->value('work_email');

    $this->actingAs(User::factory()->create())
        ->get("/admin/forms/{$form->id}/employees/compare?email={$email}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/employees/show')
            ->has('campaigns', 2)
            ->where('evaluations.0.questions.0.cells.0.answered', true)
            ->where('evaluations.0.questions.0.cells.1.answered', true)
        );
});
