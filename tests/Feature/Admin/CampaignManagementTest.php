<?php

use App\Models\Campaign;
use App\Models\Form;
use App\Models\User;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('opens a new campaign for a form', function () {
    $form = Form::factory()->create();

    $this->post("/admin/forms/{$form->id}/campaigns", [
        'name' => 'Q1 2026',
        'starts_at' => now()->toDateString(),
        'ends_at' => now()->addDays(10)->toDateString(),
    ])->assertRedirect();

    expect($form->campaigns()->count())->toBe(1)
        ->and($form->openCampaign())->not->toBeNull();
});

it('rejects opening a second campaign while one is open', function () {
    $form = Form::factory()->create();
    Campaign::factory()->open()->for($form)->create();

    $this->from("/admin/forms/{$form->id}/campaigns")
        ->post("/admin/forms/{$form->id}/campaigns", [
            'name' => 'Otra',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(5)->toDateString(),
        ])
        ->assertSessionHasErrors('name');

    expect($form->campaigns()->count())->toBe(1);
});

it('closes an open campaign', function () {
    $campaign = Campaign::factory()->open()->create();

    $this->post("/admin/campaigns/{$campaign->id}/close")->assertRedirect();

    expect($campaign->fresh()->isOpen())->toBeFalse();
});

it('reopens a closed campaign that is still within its window', function () {
    $campaign = Campaign::factory()->closed()->create();

    $this->post("/admin/campaigns/{$campaign->id}/reopen")->assertRedirect();

    expect($campaign->fresh()->closed_at)->toBeNull()
        ->and($campaign->fresh()->isOpen())->toBeTrue();
});

it('reopens an expired campaign by extending its end date', function () {
    $campaign = Campaign::factory()->create([
        'starts_at' => now()->subMonth()->toDateString(),
        'ends_at' => now()->subWeek()->toDateString(),
        'closed_at' => now(),
    ]);

    $this->post("/admin/campaigns/{$campaign->id}/reopen")->assertRedirect();

    expect($campaign->fresh()->closed_at)->toBeNull()
        ->and($campaign->fresh()->ends_at->isFuture())->toBeTrue()
        ->and($campaign->fresh()->isOpen())->toBeTrue();
});

it('rejects reopening a campaign while another one is open', function () {
    $form = Form::factory()->create();
    Campaign::factory()->open()->for($form)->create();
    $closed = Campaign::factory()->closed()->for($form)->create();

    $this->from("/admin/forms/{$form->id}/campaigns")
        ->post("/admin/campaigns/{$closed->id}/reopen")
        ->assertSessionHasErrors('name');

    expect($closed->fresh()->closed_at)->not->toBeNull();
});
