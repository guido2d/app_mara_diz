<?php

namespace Database\Factories;

use App\Enums\QuestionType;
use App\Models\Evaluation;
use App\Models\Question;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Question> */
class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'evaluation_id' => Evaluation::factory(),
            'label' => fake()->sentence().'?',
            'type' => QuestionType::Radio,
            'required' => true,
            'position' => 0,
        ];
    }
}
