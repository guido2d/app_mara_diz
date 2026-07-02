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
        'authorizes_medical_access' => '1',
    ], $extra);
}

it('stores a submission with a snapshotted answer and total, then redirects to thank-you', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $this->post("/f/{$form->slug}", validProfile([
        'answers' => [$q->id => $high->id],
    ]))->assertRedirect("/f/{$form->slug}/gracias");

    $submission = Submission::first();
    $answer = $submission->answers->first();

    expect($submission->work_email)->toBe('ana@empresa.test')
        ->and($submission->answers)->toHaveCount(1)
        ->and($answer->question_label)->toBe('Q1')
        ->and($answer->option_label)->toBe('Siempre')
        ->and($answer->option_points)->toBe(3)
        ->and($submission->results->first()->total_points)->toBe(3);
});

it('normalizes the work email (trim + lowercase) on store', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $this->post("/f/{$form->slug}", validProfile([
        'work_email' => '  Ana@Empresa.TEST ',
        'answers' => [$q->id => $high->id],
    ]))->assertRedirect("/f/{$form->slug}/gracias");

    expect(Submission::first()->work_email)->toBe('ana@empresa.test');
});

it('blocks a duplicate email regardless of case or spacing', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();
    Submission::factory()->for($campaign)->create(['work_email' => 'ana@empresa.test']);

    $this->from("/f/{$form->slug}")
        ->post("/f/{$form->slug}", validProfile([
            'work_email' => 'ANA@empresa.test',
            'answers' => [$q->id => $high->id],
        ]))
        ->assertSessionHasErrors('work_email');

    expect(Submission::where('work_email', 'ana@empresa.test')->count())->toBe(1);
});

it('stores the medical access authorization', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $this->post("/f/{$form->slug}", validProfile([
        'authorizes_medical_access' => '0',
        'answers' => [$q->id => $high->id],
    ]))->assertRedirect("/f/{$form->slug}/gracias");

    expect(Submission::first()->authorizes_medical_access)->toBeFalse();
});

it('rejects a submission without the medical access authorization', function () {
    [$form, $campaign, $q, $high] = openFormWithRadio();

    $profile = validProfile(['answers' => [$q->id => $high->id]]);
    unset($profile['authorizes_medical_access']);

    $this->from("/f/{$form->slug}")
        ->post("/f/{$form->slug}", $profile)
        ->assertSessionHasErrors('authorizes_medical_access');
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
