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

    foreach ([['Cada 15 días', 0], ['1 vez por semana', 1], ['Casi todos los días', 3]] as $position => [$label, $points]) {
        $shown->options()->create(['label' => $label, 'points' => $points, 'position' => $position + 1]);
    }

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);

    $first = Campaign::factory()->for($form)->create(['name' => 'Primera toma']);
    $second = Campaign::factory()->for($form)->create(['name' => 'Segunda toma']);

    return [$form, $evaluation, $hidden, $shown, $first, $second];
}

/**
 * Record one person's answer to one question, plus the evaluation total. The
 * answer points at the question's own option — matched by label when one is
 * given, by points otherwise — so the distribution can group by option.
 */
function answerInCampaign(Campaign $campaign, Question $question, int $points, ?int $total = null, ?string $label = null): Submission
{
    $submission = Submission::factory()->for($campaign)->create();

    $option = $question->options()
        ->when(
            $label !== null,
            fn ($query) => $query->where('label', $label),
            fn ($query) => $query->where('points', $points),
        )
        ->first();

    $submission->answers()->create([
        'question_id' => $question->id,
        'question_label' => $question->label,
        'question_type' => QuestionType::Radio,
        'question_option_id' => $option?->id,
        'option_label' => $option?->label ?? $label ?? "Opción {$points}",
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

it('counts how many people picked each option in every campaign', function () {
    [$form, , , $shown, $first, $second] = reportFixture();

    answerInCampaign($first, $shown, 0);
    answerInCampaign($first, $shown, 0);
    answerInCampaign($first, $shown, 3);
    answerInCampaign($second, $shown, 0);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('evaluations.0.questions.0.distribution.options', 3)
            ->where('evaluations.0.questions.0.distribution.options.0.label', 'Cada 15 días')
            ->where('evaluations.0.questions.0.distribution.options.0.counts.0.count', 2)
            ->where('evaluations.0.questions.0.distribution.options.0.counts.0.percent', 67)
            ->where('evaluations.0.questions.0.distribution.options.0.counts.1.count', 1)
            ->where('evaluations.0.questions.0.distribution.options.0.counts.1.percent', 100)
            ->where('evaluations.0.questions.0.distribution.options.2.label', 'Casi todos los días')
            ->where('evaluations.0.questions.0.distribution.options.2.counts.0.count', 1)
            ->where('evaluations.0.questions.0.distribution.options.2.counts.0.percent', 33)
        );
});

it('lists the options in their own order, including the ones nobody picked', function () {
    [$form, , , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 0);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.distribution.options.1.label', '1 vez por semana')
            ->where('evaluations.0.questions.0.distribution.options.1.counts.0.count', 0)
            ->where('evaluations.0.questions.0.distribution.options.1.counts.0.percent', 0)
        );
});

it('compares each option against the previous campaign in percentage points', function () {
    [$form, , , $shown, $first, $second] = reportFixture();

    answerInCampaign($first, $shown, 0);
    answerInCampaign($first, $shown, 3);
    answerInCampaign($second, $shown, 0);
    answerInCampaign($second, $shown, 0);
    answerInCampaign($second, $shown, 0);
    answerInCampaign($second, $shown, 3);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.distribution.options.0.counts.0.delta', null)
            ->where('evaluations.0.questions.0.distribution.options.0.counts.1.delta', 25)
            ->where('evaluations.0.questions.0.distribution.options.2.counts.1.delta', -25)
        );
});

it('leaves the difference empty when a campaign has nobody to compare against', function () {
    [$form, , , $shown, $first, $second] = reportFixture();
    answerInCampaign($second, $shown, 0);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.distribution.options.0.counts.0.percent', null)
            ->where('evaluations.0.questions.0.distribution.options.0.counts.0.count', 0)
            ->where('evaluations.0.questions.0.distribution.options.0.counts.1.delta', null)
        );
});

it('reports how many people answered each question in every campaign', function () {
    [$form, , , $shown, $first, $second] = reportFixture();

    answerInCampaign($first, $shown, 0);
    answerInCampaign($first, $shown, 1);
    answerInCampaign($second, $shown, 3);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.distribution.answers.0.total', 2)
            ->where('evaluations.0.questions.0.distribution.answers.1.total', 1)
        );
});

it('marks growing on a zero point option as good when less is better, and the opposite otherwise', function () {
    [$form, $evaluation, , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 0);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.distribution.options.0.growth_is_good', true)
            ->where('evaluations.0.questions.0.distribution.options.1.growth_is_good', false)
            ->where('evaluations.0.questions.0.distribution.options.2.growth_is_good', false)
        );

    $evaluation->update(['lower_is_better' => false]);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.distribution.options.0.growth_is_good', false)
            ->where('evaluations.0.questions.0.distribution.options.2.growth_is_good', true)
        );
});

it('does not break down the options of evaluations reported as a percentage', function () {
    [$form, $evaluation, , $shown, $first] = reportFixture();
    $evaluation->update(['report_metric' => ReportMetric::PositiveRate]);
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('evaluations.0.questions.0.distribution', null));
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

it('reports the percentage of people who answered yes when the evaluation asks for it', function () {
    [$form, $evaluation, , $shown, $first, $second] = reportFixture();
    $evaluation->update(['report_metric' => ReportMetric::YesRate, 'is_scored' => false]);

    answerInCampaign($first, $shown, 0, label: 'Sí');
    answerInCampaign($first, $shown, 0, label: 'No');
    answerInCampaign($first, $shown, 0, label: 'No sabe');
    answerInCampaign($second, $shown, 0, label: 'Sí');

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.metric', 'yes_rate')
            ->where('evaluations.0.questions.0.values.0.value', 33.3)
            ->where('evaluations.0.questions.0.values.0.answers', 3)
            ->where('evaluations.0.questions.0.values.1.value', 100)
        );
});

it('counts "No sabe" as somebody without the symptom, not as a missing answer', function () {
    [$form, $evaluation, , $shown, $first] = reportFixture();
    $evaluation->update(['report_metric' => ReportMetric::YesRate, 'is_scored' => false]);

    answerInCampaign($first, $shown, 0, label: 'Sí');
    answerInCampaign($first, $shown, 0, label: 'No sabe');

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('evaluations.0.questions.0.values.0.value', 50)
            ->where('evaluations.0.questions.0.values.0.answers', 2)
        );
});

it('exposes whether the evaluation totalizes points', function () {
    [$form, $evaluation, , $shown, $first] = reportFixture();
    answerInCampaign($first, $shown, 1);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('evaluations.0.is_scored', true));

    $evaluation->update(['is_scored' => false]);

    $this->get("/admin/forms/{$form->id}/report")
        ->assertInertia(fn ($page) => $page->where('evaluations.0.is_scored', false));
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
