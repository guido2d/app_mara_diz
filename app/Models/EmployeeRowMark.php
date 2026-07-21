<?php

namespace App\Models;

use App\Enums\RowMarkColor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A colour flag (red / green) an admin puts on a single question row of the
 * employee comparison view. It belongs to one employee (normalized work email)
 * within one form, so the same question can be flagged differently per person.
 */
class EmployeeRowMark extends Model
{
    protected $fillable = ['form_id', 'question_id', 'work_email', 'color'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'color' => RowMarkColor::class,
        ];
    }

    /** @return BelongsTo<Form, $this> */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /** @return BelongsTo<Question, $this> */
    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }
}
