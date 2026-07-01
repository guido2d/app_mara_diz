<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

function evaluationWithMax(int $max): Evaluation
{
    $evaluation = Evaluation::factory()->create();
    $q = $evaluation->questions()->create(['label' => 'Q', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $q->options()->create(['label' => 'Min', 'points' => 0, 'position' => 1]);
    $q->options()->create(['label' => 'Max', 'points' => $max, 'position' => 2]);

    return $evaluation;
}

it('saves ranges that cover 0..max', function () {
    $evaluation = evaluationWithMax(6);

    $this->put("/admin/evaluations/{$evaluation->id}/ranges", [
        'ranges' => [
            ['min_points' => 0, 'max_points' => 3, 'result_text' => 'Bajo'],
            ['min_points' => 4, 'max_points' => 6, 'result_text' => 'Alto'],
        ],
    ])->assertRedirect();

    expect($evaluation->scoreRanges()->count())->toBe(2);
});

it('rejects ranges with a gap', function () {
    $evaluation = evaluationWithMax(6);

    $this->from("/admin/evaluations/{$evaluation->id}/ranges")
        ->put("/admin/evaluations/{$evaluation->id}/ranges", [
            'ranges' => [
                ['min_points' => 0, 'max_points' => 2, 'result_text' => 'Bajo'],
                ['min_points' => 4, 'max_points' => 6, 'result_text' => 'Alto'],
            ],
        ])
        ->assertSessionHasErrors('ranges');

    expect($evaluation->scoreRanges()->count())->toBe(0);
});

it('blocks editing ranges while a campaign using the evaluation is open', function () {
    $evaluation = evaluationWithMax(6);
    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 0]);
    Campaign::factory()->open()->for($form)->create();

    $this->from("/admin/evaluations/{$evaluation->id}/ranges")
        ->put("/admin/evaluations/{$evaluation->id}/ranges", [
            'ranges' => [['min_points' => 0, 'max_points' => 6, 'result_text' => 'Todo']],
        ])
        ->assertSessionHasErrors('ranges');

    expect($evaluation->scoreRanges()->count())->toBe(0);
});
