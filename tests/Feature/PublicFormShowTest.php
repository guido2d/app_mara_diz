<?php

use App\Enums\QuestionType;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;

it('shows the form when a campaign is open', function () {
    $evaluation = Evaluation::factory()->create();
    $q = $evaluation->questions()->create(['label' => 'Q1', 'type' => QuestionType::Radio, 'required' => true, 'position' => 1]);
    $q->options()->create(['label' => 'Nunca', 'points' => 0, 'position' => 1]);

    $form = Form::factory()->create();
    $form->evaluations()->attach($evaluation, ['position' => 1]);
    Campaign::factory()->open()->for($form)->create();

    $this->get("/f/{$form->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('public/form')
            ->has('evaluations.0.questions.0.options.0'));
});

it('shows unavailable when there is no open campaign', function () {
    $form = Form::factory()->create();
    Campaign::factory()->closed()->for($form)->create();

    $this->get("/f/{$form->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/unavailable'));
});
