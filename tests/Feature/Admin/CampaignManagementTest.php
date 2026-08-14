<?php

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

beforeEach(fn () => $this->actingAs(User::factory()->create()));

/**
 * A form with `$count` evaluations attached, ready to be picked from when
 * opening a campaign.
 */
function formWithEvaluations(int $count = 2): Form
{
    $form = Form::factory()->create();

    Evaluation::factory()->count($count)->create()->each(
        fn (Evaluation $evaluation, int $position) => $form->evaluations()->attach($evaluation, ['position' => $position]),
    );

    return $form->load('evaluations');
}

it('renders the campaigns index with the form slug for the public link', function () {
    $form = Form::factory()->create(['slug' => 'clima-laboral']);

    $this->get("/admin/forms/{$form->id}/campaigns")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/campaigns/index')
            ->where('form.slug', 'clima-laboral')
        );
});

it('opens a new campaign with the selected evaluations', function () {
    $form = formWithEvaluations(3);
    $chosen = $form->evaluations->take(2);

    $this->post("/admin/forms/{$form->id}/campaigns", [
        'name' => 'Q1 2026',
        'starts_at' => now()->toDateString(),
        'ends_at' => now()->addDays(10)->toDateString(),
        'evaluation_ids' => $chosen->pluck('id')->all(),
    ])->assertRedirect();

    expect($form->campaigns()->count())->toBe(1)
        ->and($form->openCampaign())->not->toBeNull()
        ->and($form->openCampaign()->evaluations->pluck('id')->all())
        ->toBe($chosen->pluck('id')->all());
});

it('rejects opening a campaign without evaluations', function () {
    $form = formWithEvaluations();

    $this->from("/admin/forms/{$form->id}/campaigns")
        ->post("/admin/forms/{$form->id}/campaigns", [
            'name' => 'Sin evaluaciones',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(10)->toDateString(),
        ])
        ->assertSessionHasErrors('evaluation_ids');

    expect($form->campaigns()->count())->toBe(0);
});

it('rejects an evaluation that does not belong to the form', function () {
    $form = formWithEvaluations();
    $foreign = Evaluation::factory()->create();

    $this->from("/admin/forms/{$form->id}/campaigns")
        ->post("/admin/forms/{$form->id}/campaigns", [
            'name' => 'Ajena',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(10)->toDateString(),
            'evaluation_ids' => [$foreign->id],
        ])
        ->assertSessionHasErrors('evaluation_ids.0');

    expect($form->campaigns()->count())->toBe(0);
});

it('rejects opening a second campaign while one is open', function () {
    $form = formWithEvaluations();
    Campaign::factory()->open()->for($form)->create();

    $this->from("/admin/forms/{$form->id}/campaigns")
        ->post("/admin/forms/{$form->id}/campaigns", [
            'name' => 'Otra',
            'starts_at' => now()->toDateString(),
            'ends_at' => now()->addDays(5)->toDateString(),
            'evaluation_ids' => $form->evaluations->pluck('id')->all(),
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

it('deletes a campaign without submissions', function () {
    $campaign = Campaign::factory()->closed()->create();

    $this->delete("/admin/campaigns/{$campaign->id}")->assertRedirect();

    expect(Campaign::find($campaign->id))->toBeNull();
});

it('deletes a campaign together with its submissions and results', function () {
    $campaign = Campaign::factory()->closed()->create();
    $submission = Submission::factory()->for($campaign)->create();
    $evaluation = Evaluation::factory()->create();
    $submission->results()->create(['evaluation_id' => $evaluation->id, 'total_points' => 5]);

    $this->delete("/admin/campaigns/{$campaign->id}")->assertRedirect();

    expect(Campaign::find($campaign->id))->toBeNull()
        ->and(Submission::find($submission->id))->toBeNull()
        ->and(DB::table('submission_results')->where('submission_id', $submission->id)->count())->toBe(0);
});

it('lists the campaigns oldest first with their evaluations', function () {
    $form = formWithEvaluations();
    $older = Campaign::factory()->closed()->for($form)->create(['name' => 'Primera', 'created_at' => now()->subMonth()]);
    $newer = Campaign::factory()->closed()->for($form)->create(['name' => 'Segunda', 'created_at' => now()]);

    $this->get("/admin/forms/{$form->id}/campaigns")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('campaigns.0.id', $older->id)
            ->where('campaigns.1.id', $newer->id)
            ->where('campaigns.0.evaluations', $form->evaluations->pluck('name')->all())
            ->has('evaluations', 2)
        );
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
