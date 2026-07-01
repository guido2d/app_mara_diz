<?php

namespace Database\Factories;

use App\Models\Campaign;
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
