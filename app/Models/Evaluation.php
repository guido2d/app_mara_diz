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

    protected $fillable = ['name', 'slug', 'description', 'position', 'is_scored'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_scored' => 'boolean',
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

    public function maxPossiblePoints(): int
    {
        return (int) $this->questions()
            ->with('options')
            ->get()
            ->filter(fn (Question $q) => $q->type->isScored())
            ->sum(fn (Question $q) => (int) $q->options->max('points'));
    }
}
