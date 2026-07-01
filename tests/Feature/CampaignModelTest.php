<?php

use App\Models\Campaign;
use App\Models\Form;

it('reports a campaign as open only within its window and not closed', function () {
    $open = Campaign::factory()->open()->create();
    $closedManually = Campaign::factory()->open()->create(['closed_at' => now()]);
    $past = Campaign::factory()->create([
        'starts_at' => now()->subDays(10)->toDateString(),
        'ends_at' => now()->subDays(5)->toDateString(),
        'closed_at' => null,
    ]);

    expect($open->isOpen())->toBeTrue()
        ->and($closedManually->isOpen())->toBeFalse()
        ->and($past->isOpen())->toBeFalse();
});

it('exposes the single open campaign of a form', function () {
    $form = Form::factory()->create();
    Campaign::factory()->closed()->for($form)->create();
    $open = Campaign::factory()->open()->for($form)->create();

    expect($form->openCampaign()?->is($open))->toBeTrue();
});
