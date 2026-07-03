<?php

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Submission;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('lists submissions with their results for a campaign', function () {
    $campaign = Campaign::factory()->open()->create();
    $evaluation = Evaluation::factory()->create();
    $submission = Submission::factory()->for($campaign)->create(['first_name' => 'Ana', 'last_name' => 'García']);
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 5]);

    $this->get("/admin/campaigns/{$campaign->id}/results")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/results/index')->has('submissions', 1));
});

it('shows a single submission detail', function () {
    $submission = Submission::factory()->create(['first_name' => 'Ana']);

    $this->get("/admin/submissions/{$submission->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/results/show')->where('submission.first_name', 'Ana'));
});

it('corrects a mistyped work email and normalizes it', function () {
    $submission = Submission::factory()->create(['work_email' => 'ana.mal@empresa.test']);

    $this->patch("/admin/submissions/{$submission->id}/email", ['work_email' => '  ANA@Empresa.test '])
        ->assertRedirect();

    expect($submission->fresh()->work_email)->toBe('ana@empresa.test');
});

it('rejects an email already used by another submission in the same campaign', function () {
    $campaign = Campaign::factory()->create();
    Submission::factory()->for($campaign)->create(['work_email' => 'ana@empresa.test']);
    $other = Submission::factory()->for($campaign)->create(['work_email' => 'beto@empresa.test']);

    $this->patch("/admin/submissions/{$other->id}/email", ['work_email' => 'ana@empresa.test'])
        ->assertSessionHasErrors('work_email');

    expect($other->fresh()->work_email)->toBe('beto@empresa.test');
});
