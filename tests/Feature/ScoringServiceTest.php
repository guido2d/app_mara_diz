<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Services\ScoringService;

it('stores one total snapshot per scored evaluation from the frozen answer points', function () {
    $evaluation = Evaluation::factory()->create();
    $q1 = $evaluation->questions()->create(['label' => 'Q1', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $q2 = $evaluation->questions()->create(['label' => 'Q2', 'type' => QuestionType::Select, 'required' => true, 'position' => 2]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    $campaign = Campaign::factory()->open()->for($form)->create();
    $submission = Submission::factory()->for($campaign)->create();

    // Puntos congelados en la Respuesta: 3 + 5 = 8
    $submission->answers()->create(['question_id' => $q1->id, 'question_label' => 'Q1', 'question_type' => QuestionType::Radio, 'option_label' => 'Siempre', 'option_points' => 3]);
    $submission->answers()->create(['question_id' => $q2->id, 'question_label' => 'Q2', 'question_type' => QuestionType::Select, 'option_label' => 'Alto', 'option_points' => 5]);

    app(ScoringService::class)->computeAndStore($submission->fresh('answers'));

    $result = $submission->results()->first();
    expect($result->total_points)->toBe(8)
        ->and($result->evaluation_id)->toBe($evaluation->id);
});

it('does not store a result for a purely informative evaluation', function () {
    $evaluation = Evaluation::factory()->create();
    $evaluation->questions()->create(['label' => 'Comentario', 'type' => QuestionType::Textarea, 'required' => false, 'position' => 1]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    $campaign = Campaign::factory()->open()->for($form)->create();
    $submission = Submission::factory()->for($campaign)->create();

    app(ScoringService::class)->computeAndStore($submission->fresh('answers'));

    expect($submission->results()->count())->toBe(0);
});
