<?php

use App\Models\Evaluation;
use App\Models\Form;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists forms for the admin', function () {
    Form::factory()->count(2)->create();

    $this->get('/admin/forms')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/forms/index')->has('forms', 2));
});

it('creates a form composing evaluations in order', function () {
    $a = Evaluation::factory()->create();
    $b = Evaluation::factory()->create();

    $this->post('/admin/forms', [
        'name' => 'Bienestar 2026',
        'description' => 'Medición anual',
        'evaluation_ids' => [$b->id, $a->id],
    ])->assertRedirect();

    $form = Form::firstWhere('name', 'Bienestar 2026');
    expect($form->slug)->toBe('bienestar-2026')
        ->and($form->evaluations()->pluck('evaluations.id')->all())->toBe([$b->id, $a->id]);
});

it('updates a form and re-syncs its evaluations', function () {
    $form = Form::factory()->create();
    $a = Evaluation::factory()->create();
    $form->evaluations()->attach($a, ['position' => 0]);
    $b = Evaluation::factory()->create();

    $this->put("/admin/forms/{$form->id}", [
        'name' => $form->name,
        'description' => null,
        'evaluation_ids' => [$b->id],
    ])->assertRedirect();

    expect($form->evaluations()->pluck('evaluations.id')->all())->toBe([$b->id]);
});
