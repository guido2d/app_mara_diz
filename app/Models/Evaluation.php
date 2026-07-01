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

    protected $fillable = ['name', 'slug', 'description', 'position'];

    /** @return HasMany<Question, $this> */
    public function questions(): HasMany
    {
        return $this->hasMany(Question::class)->orderBy('position');
    }

    /** @return HasMany<ScoreRange, $this> */
    public function scoreRanges(): HasMany
    {
        return $this->hasMany(ScoreRange::class)->orderBy('position');
    }

    /** @return BelongsToMany<Form, $this> */
    public function forms(): BelongsToMany
    {
        return $this->belongsToMany(Form::class)->withPivot('position')->withTimestamps();
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
