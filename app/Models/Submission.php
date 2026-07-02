<?php

namespace App\Models;

use App\Enums\CohabitationGroup;
use App\Enums\MaritalStatus;
use App\Enums\Sex;
use Database\Factories\SubmissionFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Submission extends Model
{
    /** @use HasFactory<SubmissionFactory> */
    use HasFactory;

    protected $fillable = [
        'campaign_id', 'first_name', 'last_name', 'role_function', 'age', 'sex',
        'marital_status', 'children_count', 'cohabitation_group', 'work_email', 'phone',
        'authorizes_medical_access', 'submitted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'age' => 'integer',
            'children_count' => 'integer',
            'authorizes_medical_access' => 'boolean',
            'sex' => Sex::class,
            'marital_status' => MaritalStatus::class,
            'cohabitation_group' => CohabitationGroup::class,
            'submitted_at' => 'datetime',
        ];
    }

    /**
     * Normalize the work email (trim + lowercase) so it can identify a person across campaigns.
     *
     * @return Attribute<string, string>
     */
    protected function workEmail(): Attribute
    {
        return Attribute::make(
            set: fn (string $value): string => mb_strtolower(trim($value)),
        );
    }

    /** @return BelongsTo<Campaign, $this> */
    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    /** @return HasMany<SubmissionAnswer, $this> */
    public function answers(): HasMany
    {
        return $this->hasMany(SubmissionAnswer::class);
    }

    /** @return HasMany<SubmissionResult, $this> */
    public function results(): HasMany
    {
        return $this->hasMany(SubmissionResult::class);
    }
}
