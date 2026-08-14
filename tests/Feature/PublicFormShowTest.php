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

it('shows only the evaluations picked for the open campaign', function () {
    $included = Evaluation::factory()->create(['name' => 'Incluida']);
    $excluded = Evaluation::factory()->create(['name' => 'Excluida']);

    $form = Form::factory()->create();
    $form->evaluations()->attach($included, ['position' => 1]);
    $form->evaluations()->attach($excluded, ['position' => 2]);

    $campaign = Campaign::factory()->open()->for($form)->create();
    $campaign->evaluations()->sync([$included->id => ['position' => 0]]);

    $this->get("/f/{$form->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('evaluations', 1)
            ->where('evaluations.0.name', 'Incluida'));
});

it('shows unavailable when there is no open campaign', function () {
    $form = Form::factory()->create();
    Campaign::factory()->closed()->for($form)->create();

    $this->get("/f/{$form->slug}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('public/unavailable'));
});
