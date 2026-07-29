<?php

namespace App\Enums;

/**
 * How the aggregated report summarises each question of an evaluation.
 */
enum ReportMetric: string
{
    /** Average points of everyone who answered, on the question's own scale. */
    case Average = 'average';

    /** Share of people who answered with an option worth more than zero points. */
    case PositiveRate = 'positive_rate';

    /**
     * Share of people who answered "Sí". Used by classifying evaluations where
     * every option is worth zero points — "Síntomas o enfermedades" asks Sí/No/No
     * sabe and what the report needs is who reported each condition.
     */
    case YesRate = 'yes_rate';
}
