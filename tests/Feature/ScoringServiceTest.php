<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Services\ScoringService;

it('stores one snapshot result per evaluation with the matching range text', function () {
    $evaluation = Evaluation::factory()->create();
    $q1 = $evaluation->questions()->create(['label' => 'Q1', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $o1a = $q1->options()->create(['label' => 'Nunca', 'points' => 0, 'position' => 1]);
    $o1b = $q1->options()->create(['label' => 'Siempre', 'points' => 3, 'position' => 2]);
    $q2 = $evaluation->questions()->create(['label' => 'Q2', 'type' => QuestionType::Select, 'required' => true, 'position' => 2]);
    $o2a = $q2->options()->create(['label' => 'Bajo', 'points' => 1, 'position' => 1]);
    $o2b = $q2->options()->create(['label' => 'Alto', 'points' => 5, 'position' => 2]);

    $evaluation->scoreRanges()->create(['min_points' => 0, 'max_points' => 3, 'result_text' => 'Bienestar bueno', 'position' => 1]);
    $evaluation->scoreRanges()->create(['min_points' => 4, 'max_points' => 8, 'result_text' => 'Requiere atención', 'position' => 2]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    $campaign = Campaign::factory()->open()->for($form)->create();
    $submission = Submission::factory()->for($campaign)->create();

    // Elige Siempre (3) + Alto (5) = 8 → "Requiere atención"
    $submission->answers()->create(['question_id' => $q1->id, 'question_option_id' => $o1b->id]);
    $submission->answers()->create(['question_id' => $q2->id, 'question_option_id' => $o2b->id]);

    app(ScoringService::class)->computeAndStore($submission->fresh('answers'));

    $result = $submission->results()->first();
    expect($result->total_points)->toBe(8)
        ->and($result->result_text)->toBe('Requiere atención')
        ->and($result->evaluation_id)->toBe($evaluation->id);
});
