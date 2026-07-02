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

it('reports whether an evaluation is scored based on its question types', function () {
    $scored = Evaluation::factory()->create();
    $scored->questions()->create(['label' => 'A', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);

    $informative = Evaluation::factory()->create();
    $informative->questions()->create(['label' => 'B', 'type' => QuestionType::Textarea, 'required' => false, 'position' => 1]);

    expect($scored->isScored())->toBeTrue()
        ->and($informative->isScored())->toBeFalse();
});
