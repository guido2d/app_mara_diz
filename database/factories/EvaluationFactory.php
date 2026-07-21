<?php

namespace Database\Factories;

use App\Models\Evaluation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Evaluation> */
class EvaluationFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'description' => fake()->sentence(),
            'position' => 0,
            'is_scored' => true,
            'allows_row_marks' => false,
        ];
    }

    /**
     * An evaluation whose rows can be flagged red or green in the comparison view.
     */
    public function markable(): static
    {
        return $this->state(fn () => ['allows_row_marks' => true]);
    }

    /**
     * An evaluation whose radio/select questions only classify and carry no score.
     */
    public function unscored(): static
    {
        return $this->state(fn () => ['is_scored' => false]);
    }
}
