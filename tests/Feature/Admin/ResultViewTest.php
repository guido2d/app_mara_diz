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
