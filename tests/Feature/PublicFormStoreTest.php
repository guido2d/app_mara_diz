<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;

function openFormWithRadio(): array
{
    $evaluation = Evaluation::factory()->create();
    $q = $evaluation->questions()->create(['label' => 'Q1', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $low = $q->options()->create(['label' => 'Nunca', 'points' => 0, 'position' => 1]);
    $high = $q->options()->create(['label' => 'Siempre', 'points' => 3, 'position' => 2]);
    $evaluation->scoreRanges()->create(['min_points' => 0, 'max_points' => 1, 'result_text' => 'Bajo', 'position' => 1]);
    $evaluation->scoreRanges()->create(['min_points' => 2, 'max_points' => 3, 'result_text' => 'Alto', 'position' => 2]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    $campaign = Campaign::factory()->open()->for($form)->create();

    return [$form, $campaign, $q, $high];
}

function validProfile(array $extra = []): array
{
    return array_merge([
        'first_name' => 'Ana', 'last_name' => 'García', 'role_function' => 'Analista',
        'age' => 30, 'sex' => 'femenino', 'marital_status' => 'soltero',
        'children_count' => 0, 'cohabitation_group' => 'solo',
        'work_email' => 'ana@empresa.test', 'phone' => '+54 11 1234-5678',
    ], $extra);
}

it('stores a submission with answers and computed result, then redirects to thank-you', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $this->post("/f/{$form->slug}", validProfile([
        'answers' => [$q->id => $high->id],
    ]))->assertRedirect("/f/{$form->slug}/gracias");

    $submission = Submission::first();
    expect($submission->work_email)->toBe('ana@empresa.test')
        ->and($submission->answers)->toHaveCount(1)
        ->and($submission->results->first()->total_points)->toBe(3)
        ->and($submission->results->first()->result_text)->toBe('Alto');
});

it('blocks a duplicate email within the same campaign', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();
    Submission::factory()->for($campaign)->create(['work_email' => 'ana@empresa.test']);

    $this->from("/f/{$form->slug}")
        ->post("/f/{$form->slug}", validProfile(['answers' => [$q->id => $high->id]]))
        ->assertRedirect("/f/{$form->slug}")
        ->assertSessionHasErrors('work_email');

    expect(Submission::where('work_email', 'ana@empresa.test')->count())->toBe(1);
});

it('rejects a submission missing a required option answer', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $this->from("/f/{$form->slug}")
        ->post("/f/{$form->slug}", validProfile(['answers' => []]))
        ->assertSessionHasErrors("answers.{$q->id}");
});
