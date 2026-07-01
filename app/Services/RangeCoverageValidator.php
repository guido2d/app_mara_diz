<?php

namespace App\Services;

use InvalidArgumentException;

class RangeCoverageValidator
{
    /**
     * @param  array<int, array{min_points:int, max_points:int}>  $ranges
     */
    public function validate(int $maxPoints, array $ranges): void
    {
        if ($ranges === []) {
            throw new InvalidArgumentException('Debe definir al menos un rango.');
        }

        foreach ($ranges as $range) {
            if ($range['min_points'] > $range['max_points']) {
                throw new InvalidArgumentException(
                    "El rango {$range['min_points']}–{$range['max_points']} tiene el mínimo mayor que el máximo."
                );
            }
        }

        usort($ranges, fn ($a, $b) => $a['min_points'] <=> $b['min_points']);

        if ($ranges[0]['min_points'] !== 0) {
            throw new InvalidArgumentException('El primer rango debe empezar en 0.');
        }

        $last = $ranges[array_key_last($ranges)];
        if ($last['max_points'] !== $maxPoints) {
            throw new InvalidArgumentException("El último rango debe terminar en {$maxPoints} (puntaje máximo posible).");
        }

        for ($i = 1; $i < count($ranges); $i++) {
            $prevMax = $ranges[$i - 1]['max_points'];
            $currMin = $ranges[$i]['min_points'];

            if ($currMin <= $prevMax) {
                throw new InvalidArgumentException("Los rangos se solapan cerca del puntaje {$currMin}.");
            }

            if ($currMin !== $prevMax + 1) {
                throw new InvalidArgumentException("Hay un hueco entre los puntajes {$prevMax} y {$currMin}.");
            }
        }
    }
}
