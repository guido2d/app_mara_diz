<?php

use App\Enums\QuestionType;
use App\Enums\ReportMetric;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Question;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

/**
 * A form with one scored evaluation, two questions (only the second one flagged
 * for the report) and two campaigns.
 *
 * @return array{Form, Evaluation, Question, Question, Campaign, Campaign}
 */
function reportFixture(): array
{
    $evaluation = Evaluation::factory()->create(['name' => 'Síntomas psíquicos']);

    $hidden = $evaluation->questions()->create([
        'label' => 'No va al reporte', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1,
    ]);
    $shown = $evaluation->questions()->create([
        'label' => 'Preocupaciones persistentes', 'type' => QuestionType::Radio, 'required' => true, 'position' => 2, 'report_position' => 1,
    ]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $first = Campaign::factory()->for($form)->create(['name' => 'Primera toma']);
    $second = Campaign::factory()->for($form)->create(['name' => 'Segunda toma']);

    return [$form, $evaluation, $hidden, $shown, $first, $second];
}

/** Record one person's answer to one question, plus the evaluation total. */
function answerInCampaign(Campaign $campaign, Question $question, int $points, ?int $total = null): Submission
{
    $submission = Submission::factory()->for($campaign)->create();

    $submission->answers()->create([
        'question_id' => $question->id,
        'question_label' => $question->label,
        'question_type' => QuestionType::Radio,
        'option_label' => "Opción {$points}",
        'option_points' => $points,
    ]);

    if ($total !== null) {
        $submission->results()->create([
            'evaluation_id' => $question->evaluation_id,
            'total_points' => $total,
        ]);
    }

    return $submission;
}

it('only reports the questions flagged for the report', function () {
    [$form, , $hidden, $shown, $first] = reportFixture();
    answerInCampaign($first, $hidden, 3);
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/reports/show')
            ->has('evaluations.0.questions', 1)
            ->where('evaluations.0.questions.0.label', 'Preocupaciones persistentes')
        );
});

it('averages the points of everyone who answered each campaign', function () {
    [$form, , , $shown, $first, $second] = reportFixture();

    answerInCampaign($first, $shown, 3);
    answerInCampaign($first, $shown, 0);
    answerInCampaign($second, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.values.0.value', 1.5)
            ->where('evaluations.0.questions.0.values.0.answers', 2)
            ->where('evaluations.0.questions.0.values.1.value', 1)
            ->where('evaluations.0.questions.0.values.1.answers', 1)
        );
});

it('reports the percentage of positive answers when the evaluation asks for it', function () {
    [$form, $evaluation, , $shown, $first, $second] = reportFixture();
    $evaluation->update(['report_metric' => ReportMetric::PositiveRate]);

    answerInCampaign($first, $shown, 1);
    answerInCampaign($first, $shown, 0);
    answerInCampaign($first, $shown, 0);
    answerInCampaign($second, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.metric', 'positive_rate')
            ->where('evaluations.0.questions.0.values.0.value', 33.3)
            ->where('evaluations.0.questions.0.values.0.answers', 3)
            ->where('evaluations.0.questions.0.values.1.value', 100)
        );
});

it('reports the average of the points by default', function () {
    [$form, , , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('evaluations.0.metric', 'average'));
});

it('reports a campaign with no submissions as null instead of zero', function () {
    [$form, , , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 2);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.values.1.value', null)
            ->where('evaluations.0.questions.0.values.1.answers', 0)
        );
});

it('reports a question nobody answered in a campaign as null', function () {
    [$form, , , $shown, $first, $second] = reportFixture();
    answerInCampaign($first, $shown, 2);
    Submission::factory()->for($second)->create();

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.values.1.value', null)
            ->where('evaluations.0.questions.0.values.1.answers', 0)
        );
});

it('averages the evaluation total per campaign', function () {
    [$form, , , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 3, total: 30);
    answerInCampaign($first, $shown, 1, total: 10);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('evaluations.0.totals.0.average', 20));
});

it('exposes the improvement direction of each evaluation', function () {
    [$form, $evaluation, , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('evaluations.0.lower_is_better', true));

    $evaluation->update(['lower_is_better' => false]);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertInertia(fn ($page) => $page->where('evaluations.0.lower_is_better', false));
});

it('orders campaigns by creation, not by start date', function () {
    [$form, , , $shown, $first, $second] = reportFixture();
    $first->update(['starts_at' => now()->addMonth()->toDateString()]);
    $second->update(['starts_at' => now()->subMonth()->toDateString()]);
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('campaigns.0.name', 'Primera toma')
            ->where('campaigns.1.name', 'Segunda toma')
        );
});

it('returns no evaluations when the form has no questions flagged', function () {
    $evaluation = Evaluation::factory()->create();
    $evaluation->questions()->create(['label' => 'Suelta', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('evaluations', 0));
});

it('requires authentication', function () {
    $form = Form::factory()->create();

    auth()->logout();

    $this->get("/admin/forms/{$form->id}/report")->assertRedirect('/admin/login');
});
