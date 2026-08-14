<?php

namespace Database\Factories;

use App\Models\Campaign;
use App\Models\Evaluation;
use App\Models\Form;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Campaign> */
class CampaignFactory extends Factory
{
    public function definition(): array
    {
        return [
            'form_id' => Form::factory(),
            'name' => 'Campaña '.fake()->unique()->numberBetween(1, 9999),
            'starts_at' => now()->subDay()->toDateString(),
            'ends_at' => now()->addDays(7)->toDateString(),
            'closed_at' => null,
        ];
    }

    /**
     * Mirror the admin default: a new campaign starts with every evaluation of
     * its form, in the same order.
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Campaign $campaign) {
            $campaign->evaluations()->sync(
                $campaign->form->evaluations->mapWithKeys(fn (Evaluation $evaluation, int $position) => [
                    $evaluation->id => ['position' => $position],
                ])->all(),
            );
        });
    }

    public function open(): static
    {
        return $this->state(fn () => [
            'starts_at' => now()->subDay()->toDateString(),
            'ends_at' => now()->addDays(7)->toDateString(),
            'closed_at' => null,
        ]);
    }

    public function closed(): static
    {
        return $this->state(fn () => ['closed_at' => now()]);
    }
}
