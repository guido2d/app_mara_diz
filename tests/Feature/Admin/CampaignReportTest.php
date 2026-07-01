<?php

use App\Enums\Sex;
use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Submission;
use App\Models\User;
use App\Services\CampaignReport;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

it('aggregates submissions by range and by sex', function () {
    $campaign = Campaign::factory()->open()->create();
    $evaluation = Evaluation::factory()->create(['name' => 'Estrés']);

    $ana = Submission::factory()->for($campaign)->create(['sex' => Sex::Female]);
    $ana->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 2, 'score_range_id' => null, 'result_text' => 'Bajo']);

    $beto = Submission::factory()->for($campaign)->create(['sex' => Sex::Male]);
    $beto->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 8, 'score_range_id' => null, 'result_text' => 'Alto']);

    $report = app(CampaignReport::class)->for($campaign);

    expect($report['submissions_total'])->toBe(2)
        ->and($report['by_range']['Estrés']['Bajo'])->toBe(1)
        ->and($report['by_range']['Estrés']['Alto'])->toBe(1)
        ->and($report['by_sex']['Femenino'])->toBe(1)
        ->and($report['by_sex']['Masculino'])->toBe(1);
});

it('renders the report page', function () {
    $campaign = Campaign::factory()->open()->create();

    $this->get("/admin/campaigns/{$campaign->id}/report")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('admin/reports/index'));
});
