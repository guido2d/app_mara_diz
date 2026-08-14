<?php

namespace Database\Seeders;

use Carbon\CarbonImmutable;

/**
 * Second campaign of the "Prueba reportes" form: the same staff answering again
 * with the same work emails, so the report shows the evolution against the first
 * campaign and the employee comparison has two takes per person.
 *
 * The whole staff improves a bit against its baseline, and four people did not
 * answer this time, which also covers the "answered only one campaign" case.
 *
 * php artisan db:seed --class=PruebaReportesCampaign2Seeder
 */
class PruebaReportesCampaign2Seeder extends PruebaReportesCampaignSeeder
{
    protected function campaignName(): string
    {
        return 'Campaña 2';
    }

    protected function campaignStartsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse('2026-07-28');
    }

    protected function campaignEndsAt(): CarbonImmutable
    {
        return CarbonImmutable::parse('2026-07-31');
    }

    protected function randomSeed(): int
    {
        return 202607;
    }

    /**
     * Less stress and more healthy habits than in the first take: every question
     * of the report moves in the "mejoró" direction without becoming uniform.
     */
    protected function stressShift(): float
    {
        return -0.14;
    }

    /**
     * @return list<int>
     */
    protected function absentEmployees(): array
    {
        return [5, 19, 33, 41];
    }

    /**
     * The campaign is still running, so it stays open.
     */
    protected function closedAt(): ?CarbonImmutable
    {
        return null;
    }
}
