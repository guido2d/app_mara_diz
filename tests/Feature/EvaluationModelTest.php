<?php

use App\Enums\QuestionType;
use App\Models\Evaluation;

it('computes the max possible points from scored questions only', function () {
    $evaluation = Evaluation::factory()->create();

    $radio = $evaluation->questions()->create(['label' => 'A', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $radio->options()->createMany([
        ['label' => 'Nunca', 'points' => 0, 'position' => 1],
        ['label' => 'Siempre', 'points' => 3, 'position' => 2],
    ]);

    $select = $evaluation->questions()->create(['label' => 'B', 'type' => QuestionType::Select, 'required' => true, 'position' => 2]);
    $select->options()->createMany([
        ['label' => 'Bajo', 'points' => 1, 'position' => 1],
        ['label' => 'Alto', 'points' => 5, 'position' => 2],
    ]);

    // Informativa: no puntúa
    $evaluation->questions()->create(['label' => 'C', 'type' => QuestionType::Textarea, 'required' => false, 'position' => 3]);

    expect($evaluation->maxPossiblePoints())->toBe(8); // 3 + 5
});

it('checks whether a range contains a score inclusively', function () {
    $evaluation = Evaluation::factory()->create();
    $range = $evaluation->scoreRanges()->create(['min_points' => 3, 'max_points' => 6, 'result_text' => 'Medio', 'position' => 2]);

    expect($range->contains(3))->toBeTrue()
        ->and($range->contains(6))->toBeTrue()
        ->and($range->contains(7))->toBeFalse();
});
