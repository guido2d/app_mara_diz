<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

/**
 * Build a form with one scored evaluation (single radio question) and two campaigns.
 * Returns [$form, $q, $campaign1, $campaign2].
 */
function comparisonFixture(): array
{
    $evaluation = Evaluation::factory()->create(['name' => 'Estrés']);
    $q = $evaluation->questions()->create(['label' => 'Frecuencia', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $c1 = Campaign::factory()->for($form)->create(['name' => 'Q1', 'starts_at' => now()->subMonths(2)->toDateString(), 'ends_at' => now()->subMonth()->toDateString(), 'closed_at' => now()->subMonth()]);
    $c2 = Campaign::factory()->for($form)->create(['name' => 'Q2', 'starts_at' => now()->subDays(3)->toDateString(), 'ends_at' => now()->addDays(3)->toDateString()]);

    return [$form, $q, $c1, $c2];
}

function answerFor(Campaign $campaign, int $questionId, string $label, int $points, string $email): Submission
{
    $submission = Submission::factory()->for($campaign)->create(['work_email' => $email]);
    $submission->answers()->create([
        'question_id' => $questionId,
        'question_label' => 'Frecuencia',
        'question_type' => QuestionType::Radio,
        'option_label' => $label,
        'option_points' => $points,
    ]);
    $submission->results()->create([
        'evaluation_id' => $campaign->form->evaluations->first()->id,
        'total_points' => $points,
    ]);

    return $submission;
}

it('lists employees of a form grouped by normalized email', function () {
    [$form, $q, $c1, $c2] = comparisonFixture();
    answerFor($c1, $q->id, 'Nunca', 0, 'ana@empresa.test');
    answerFor($c2, $q->id, 'Siempre', 3, 'ana@empresa.test');
    answerFor($c2, $q->id, 'Nunca', 0, 'beto@empresa.test');

    $this->get("/admin/forms/{$form->id}/employees")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/employees/index')
            ->has('employees', 2)
            ->where('employees.0.email', 'ana@empresa.test')
            ->where('employees.0.campaigns_answered', 2)
        );
});

it('builds a comparison matrix with campaigns as columns in chronological order', function () {
    [$form, $q, $c1, $c2] = comparisonFixture();
    answerFor($c1, $q->id, 'Nunca', 0, 'ana@empresa.test');
    answerFor($c2, $q->id, 'Siempre', 3, 'ana@empresa.test');

    $this->get("/admin/forms/{$form->id}/employees/compare?email=ana@empresa.test")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/employees/show')
            ->where('campaigns.0.name', 'Q1')
            ->where('campaigns.1.name', 'Q2')
            ->where('evaluations.0.questions.0.cells.0.display', 'Nunca (0)')
            ->where('evaluations.0.questions.0.cells.1.display', 'Siempre (3)')
            ->where('evaluations.0.totals.0.total', 0)
            ->where('evaluations.0.totals.1.total', 3)
            ->where('general_totals.1.total', 3)
        );
});

it('includes evaluations answered by a campaign even when they are no longer on the form', function () {
    [$form, $q, $c1, $c2] = comparisonFixture();
    answerFor($c1, $q->id, 'Nunca', 0, 'ana@empresa.test');
    answerFor($c2, $q->id, 'Siempre', 3, 'ana@empresa.test');

    // An evaluation the first campaign used but that is no longer attached to
    // the form. Its answers/totals must still show up in the comparison.
    $extra = Evaluation::factory()->create(['name' => 'Sueño']);
    $extraQuestion = $extra->questions()->create(['label' => 'Horas', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);

    $first = Submission::query()->where('campaign_id', $c1->id)->where('work_email', 'ana@empresa.test')->firstOrFail();
    $first->answers()->create(['question_id' => $extraQuestion->id, 'question_label' => 'Horas', 'question_type' => QuestionType::Radio, 'option_label' => 'Pocas', 'option_points' => 1]);
    $first->results()->create(['evaluation_id' => $extra->id, 'total_points' => 1]);

    $this->get("/admin/forms/{$form->id}/employees/compare?email=ana@empresa.test")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('evaluations', 2)
            ->where('evaluations.0.name', 'Estrés')
            ->where('evaluations.1.name', 'Sueño')
            ->where('evaluations.1.questions.0.cells.0.display', 'Pocas (1)')
            ->where('evaluations.1.questions.0.cells.1.display', '—')
            ->where('evaluations.1.totals.0.total', 1)
            ->where('evaluations.1.totals.1.total', null)
        );
});

it('marks a campaign where the employee did not answer', function () {
    [$form, $q, $c1, $c2] = comparisonFixture();
    // Only answered the second campaign.
    answerFor($c2, $q->id, 'Siempre', 3, 'ana@empresa.test');

    $this->get("/admin/forms/{$form->id}/employees/compare?email=ana@empresa.test")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('campaigns.0.answered', false)
            ->where('campaigns.1.answered', true)
            ->where('evaluations.0.questions.0.cells.0.display', null)
            ->where('evaluations.0.questions.0.cells.0.answered', false)
        );
});

it('matches the email case-insensitively', function () {
    [$form, $q, $c1, $c2] = comparisonFixture();
    answerFor($c2, $q->id, 'Siempre', 3, 'ana@empresa.test');

    $this->get("/admin/forms/{$form->id}/employees/compare?email=ANA@Empresa.test")
        ->assertOk();
});

it('returns 404 when no submission matches the email', function () {
    [$form, $q, $c1, $c2] = comparisonFixture();

    $this->get("/admin/forms/{$form->id}/employees/compare?email=nadie@empresa.test")
        ->assertNotFound();
});
