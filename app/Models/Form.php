<?php

namespace App\Models;

use Database\Factories\FormFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Form extends Model
{
    /** @use HasFactory<FormFactory> */
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description'];

    /** @return BelongsToMany<Evaluation, $this> */
    public function evaluations(): BelongsToMany
    {
        return $this->belongsToMany(Evaluation::class)
            ->withPivot('position')
            ->withTimestamps()
            ->orderByPivot('position');
    }

    /** @return HasMany<Campaign, $this> */
    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class)->latest('starts_at');
    }

    public function openCampaign(): ?Campaign
    {
        return $this->campaigns()->open()->first();
    }
}
