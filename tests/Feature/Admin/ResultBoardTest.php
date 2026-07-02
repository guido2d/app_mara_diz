<?php

use App\Models\Evaluation;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists submissions across every campaign', function () {
    $evaluation = Evaluation::factory()->create();

    $a = Submission::factory()->create();
    $a->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 7]);

    Submission::factory()->create(); // otra campaña/formulario

    $this->get('/admin/results')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/results/board')
            ->has('submissions', 2)
            ->has('submissions.0', fn ($s) => $s
                ->hasAll(['id', 'name', 'work_email', 'form_name', 'campaign_name', 'submitted_at', 'total_points'])
            )
        );
});

it('sums the total points of a submission', function () {
    $evaluation = Evaluation::factory()->create();
    $submission = Submission::factory()->create();
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 4]);

    $this->get('/admin/results')
        ->assertInertia(fn ($page) => $page->where('submissions.0.total_points', 4));
});

it('requires authentication', function () {
    auth()->logout();

    $this->get('/admin/results')->assertRedirect('/admin/login');
});
