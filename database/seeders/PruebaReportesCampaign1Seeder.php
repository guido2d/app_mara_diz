<?php

namespace Database\Seeders;

use Carbon\CarbonImmutable;

/**
 * First campaign of the "Prueba reportes" form: the baseline the following
 * campaigns are compared against. The whole roster answers it.
 *
 * php artisan db:seed --class=PruebaReportesCampaign1Seeder
 */
class PruebaReportesCampaign1Seeder extends PruebaReportesCampaignSeeder
{
    protected function campaignName(): string
    {
        return 'Campaña 1 · Marzo 2026';
    }

    protected function campaignStartsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse('2026-03-02');
    }

    protected function campaignEndsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse('2026-03-27');
    }

    protected function randomSeed(): int
    {
        return 202603;
    }
}
