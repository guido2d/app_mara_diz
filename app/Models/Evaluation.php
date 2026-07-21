<?php

namespace App\Models;

use Database\Factories\EvaluationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Evaluation extends Model
{
    /** @use HasFactory<EvaluationFactory> */
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'position', 'is_scored', 'allows_row_marks'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_scored' => 'boolean',
            'allows_row_marks' => 'boolean',
        ];
    }

    /** @return HasMany<Question, $this> */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    /** @return BelongsToMany<Form, $this> */
    public function forms(): BelongsToMany
    {
        return $this->belongsToMany(Form::class)->withPivot('position')->withTimestamps();
    }

    /**
     * Whether this evaluation totalizes points. Some evaluations use radio/select
     * questions purely to classify (e.g. Sí/No/No sabe) and must not show points
     * or a total, so scoring is an explicit property rather than inferred from
     * the question types.
     */
    public function isScored(): bool
    {
        return $this->is_scored;
    }

    /**
     * Whether the admin can flag each question row in red or green from the
     * employee comparison view.
     */
    public function allowsRowMarks(): bool
    {
        return $this->allows_row_marks;
    }

    public function maxPossiblePoints(): int
    {
        return (int) $this->questions()
            ->with('options')
            ->get()
            ->filter(fn (Question $q) => $q->type->isScored())
            ->sum(fn (Question $q) => (int) $q->options->max('points'));
    }
}
