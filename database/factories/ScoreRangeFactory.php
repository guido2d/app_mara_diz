<?php

namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\ScoreRange;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ScoreRange> */
class ScoreRangeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'min_points' => 0,
            'max_points' => 10,
            'result_text' => fake()->sentence(),
            'position' => 0,
        ];
    }
}
