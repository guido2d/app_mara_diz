<?php

namespace App\Http\Requests;

use App\Enums\CohabitationGroup;
use App\Enums\MaritalStatus;
use App\Enums\Sex;
use App\Models\Campaign;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('work_email'))) {
            $this->merge(['work_email' => mb_strtolower(trim($this->input('work_email')))]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'role_function' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer', 'min:16', 'max:99'],
            'sex' => ['required', Rule::enum(Sex::class)],
            'marital_status' => ['required', Rule::enum(MaritalStatus::class)],
            'children_count' => ['required', 'integer', 'min:0', 'max:20'],
            'cohabitation_group' => ['required', Rule::enum(CohabitationGroup::class)],
            'work_email' => ['required', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'authorizes_medical_access' => ['required', 'boolean'],
            'answers' => ['array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            /** @var Campaign $campaign */
            $campaign = $this->route('campaign');
            $questions = $campaign->form->evaluations->flatMap->questions;
            $answers = (array) $this->input('answers', []);

            foreach ($questions as $question) {
                $value = $answers[$question->id] ?? null;
                $mustAnswer = $question->type->isScored() || $question->required;

                if ($mustAnswer && ($value === null || $value === '')) {
                    $validator->errors()->add("answers.{$question->id}", 'Esta pregunta es obligatoria.');

                    continue;
                }

                if ($question->type->isScored() && $value !== null && $value !== '') {
                    $belongs = $question->options->contains(fn ($o) => (string) $o->id === (string) $value);
                    if (! $belongs) {
                        $validator->errors()->add("answers.{$question->id}", 'Opción inválida.');
                    }
                }
            }
        });
    }
}
