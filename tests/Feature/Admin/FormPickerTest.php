<?php

use App\Models\Campaign;
use App\Models\Form;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists the forms with their campaign and submission counts on the reports index', function () {
    $form = Form::factory()->create(['name' => 'Evaluación Empresa X']);
    $campaign = Campaign::factory()->for($form)->create();
    Submission::factory()->for($campaign)->count(3)->create();

    $this->get('/admin/reports')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/picker')
            ->where('suffix', 'report')
            ->where('forms.0.name', 'Evaluación Empresa X')
            ->where('forms.0.campaigns_count', 1)
            ->where('forms.0.submissions_count', 3)
        );
});

it('serves the comparison index without depending on a hardcoded form id', function () {
    Form::factory()->create();

    $this->get('/admin/comparativo')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/forms/picker')
            ->where('suffix', 'employees')
        );
});

it('renders both indexes with no forms at all', function () {
    $this->get('/admin/reports')->assertOk()->assertInertia(fn ($page) => $page->has('forms', 0));
    $this->get('/admin/comparativo')->assertOk()->assertInertia(fn ($page) => $page->has('forms', 0));
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/reports')->assertRedirect('/admin/login');
    $this->get('/admin/comparativo')->assertRedirect('/admin/login');
});
