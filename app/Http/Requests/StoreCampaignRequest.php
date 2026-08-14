<?php

namespace App\Http\Requests;

use App\Models\Form;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCampaignRequest extends FormRequest
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
        /** @var Form $form */
        $form = $this->route('form');

        return [
            'name' => ['required', 'string', 'max:255'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
            'evaluation_ids' => ['required', 'array', 'min:1'],
            'evaluation_ids.*' => ['integer', Rule::in($form->evaluations()->pluck('evaluations.id'))],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'evaluation_ids.required' => 'Elegí al menos una evaluación para la campaña.',
            'evaluation_ids.min' => 'Elegí al menos una evaluación para la campaña.',
            'evaluation_ids.*.in' => 'Esa evaluación no pertenece a este formulario.',
        ];
    }
}
