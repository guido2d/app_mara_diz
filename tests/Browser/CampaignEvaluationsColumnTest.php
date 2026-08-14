<?php

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\User;

it('summarises the campaign evaluations in the table and lists them on hover', function () {
    $this->actingAs(User::factory()->create());

    $form = Form::factory()->create();
    Evaluation::factory()->count(3)->create()->each(
        fn (Evaluation $evaluation, int $position) => $form->evaluations()->attach($evaluation, ['position' => $position]),
    );

    Campaign::factory()->closed()->for($form)->create(['name' => 'Toma completa']);
    $partial = Campaign::factory()->closed()->for($form)->create(['name' => 'Toma parcial']);
    $partial->evaluations()->sync([$form->evaluations->first()->id => ['position' => 0]]);

    visit("/admin/forms/{$form->id}/campaigns")
        ->assertNoJavaScriptErrors()
        ->assertSee('Todas (3)')
        ->assertSee('1 de 3')
        ->hover('text=1 de 3')
        ->assertVisible('[role="tooltip"]')
        ->assertSee($form->evaluations->first()->name);
});
