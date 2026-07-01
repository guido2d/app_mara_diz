<?php

namespace App\Models;

use Database\Factories\ScoreRangeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreRange extends Model
{
    /** @use HasFactory<ScoreRangeFactory> */
    use HasFactory;

    protected $fillable = ['evaluation_id', 'min_points', 'max_points', 'result_text', 'position'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'min_points' => 'integer',
            'max_points' => 'integer',
        ];
    }

    /** @return BelongsTo<Evaluation, $this> */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    public function contains(int $points): bool
    {
        return $points >= $this->min_points && $points <= $this->max_points;
    }
}
