<?php

namespace App\Models;

use Database\Factories\CampaignFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    /** @use HasFactory<CampaignFactory> */
    use HasFactory;

    protected $fillable = ['form_id', 'name', 'starts_at', 'ends_at', 'closed_at'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'date',
            'ends_at' => 'date',
            'closed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Form, $this> */
    public function form(): BelongsTo
    {
        return $this->belongsTo(Form::class);
    }

    /** @return HasMany<Submission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function isOpen(): bool
    {
        return $this->closed_at === null
            && $this->starts_at->startOfDay()->lte(now())
            && $this->ends_at->endOfDay()->gte(now());
    }

    /** @param  Builder<Campaign>  $query */
    public function scopeOpen(Builder $query): void
    {
        $query->whereNull('closed_at')
            ->whereDate('starts_at', '<=', now())
            ->whereDate('ends_at', '>=', now());
    }
}
