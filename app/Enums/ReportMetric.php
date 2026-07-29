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
}
