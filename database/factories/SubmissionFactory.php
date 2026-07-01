<?php

namespace Database\Factories;

use App\Enums\CohabitationGroup;
use App\Enums\MaritalStatus;
use App\Enums\Sex;
use App\Models\Campaign;
use App\Models\Submission;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Submission> */
class SubmissionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'campaign_id' => Campaign::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'role_function' => fake()->jobTitle(),
            'age' => fake()->numberBetween(18, 70),
            'sex' => fake()->randomElement(Sex::cases()),
            'marital_status' => fake()->randomElement(MaritalStatus::cases()),
            'children_count' => fake()->numberBetween(0, 4),
            'cohabitation_group' => fake()->randomElement(CohabitationGroup::cases()),
            'work_email' => fake()->unique()->companyEmail(),
            'phone' => fake()->numerify('+54 9 ## ####-####'),
            'authorizes_medical_access' => fake()->boolean(),
            'submitted_at' => now(),
        ];
    }
}
