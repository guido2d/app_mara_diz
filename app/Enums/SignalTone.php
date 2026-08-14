<?php

namespace App\Enums;

/**
 * The traffic light an answer gets in the report: green for the most benign
 * option of a question, red for the worst, amber for everything in between.
 */
enum SignalTone: string
{
    case Good = 'good';
    case Warning = 'warning';
    case Bad = 'bad';
}
