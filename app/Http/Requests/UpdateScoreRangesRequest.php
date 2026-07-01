<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateScoreRangesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'ranges' => ['required', 'array', 'min:1'],
            'ranges.*.min_points' => ['required', 'integer', 'min:0'],
            'ranges.*.max_points' => ['required', 'integer', 'min:0'],
            'ranges.*.result_text' => ['required', 'string'],
        ];
    }
}
