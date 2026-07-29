<?php

use App\Models\Evaluation;
use App\Models\Question;

it('only includes questions flagged for the report, ordered by report position', function () {
    $evaluation = Evaluation::factory()->create();

    $evaluation->questions()->create(['label' => 'Fuera del reporte', 'type' => 'radio', 'required' => true, 'position' => 1]);
    $evaluation->questions()->create(['label' => 'Segunda del reporte', 'type' => 'radio', 'required' => true, 'position' => 2, 'report_position' => 2]);
    $evaluation->questions()->create(['label' => 'Primera del reporte', 'type' => 'radio', 'required' => true, 'position' => 3, 'report_position' => 1]);

    $labels = Question::query()->where('evaluation_id', $evaluation->id)->inReport()->pluck('label');

    expect($labels->all())->toBe(['Primera del reporte', 'Segunda del reporte']);
});

it('ignores the form position when ordering the report questions', function () {
    $evaluation = Evaluation::factory()->create();

    $evaluation->questions()->create(['label' => 'Va segunda', 'type' => 'radio', 'required' => true, 'position' => 1, 'report_position' => 2]);
    $evaluation->questions()->create(['label' => 'Va primera', 'type' => 'radio', 'required' => true, 'position' => 2, 'report_position' => 1]);

    expect($evaluation->questions()->inReport()->pluck('label')->all())
        ->toBe(['Va primera', 'Va segunda']);
});
