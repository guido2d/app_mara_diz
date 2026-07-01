<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubmissionResult extends Model
{
    protected $fillable = ['submission_id', 'evaluation_id', 'total_points', 'score_range_id', 'result_text'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return ['total_points' => 'integer'];
    }

    /** @return BelongsTo<Submission, $this> */
    public function submission(): BelongsTo
    {
        return $this->belongsTo(Submission::class);
    }

    /** @return BelongsTo<Evaluation, $this> */
    public function evaluation(): BelongsTo
    {
        return $this->belongsTo(Evaluation::class);
    }

    /** @return BelongsTo<ScoreRange, $this> */
    public function scoreRange(): BelongsTo
    {
        return $this->belongsTo(ScoreRange::class);
    }
}
