# 3. Respuestas individuales sin Rangos; snapshot a nivel Respuesta

Fecha: 2026-07-01
Estado: Aceptado
Reemplaza: [0002](0002-snapshot-de-resultados-por-envio.md)

## Contexto

La devolución de las Evaluaciones cambia de eje. Antes el análisis se centraba en el
puntaje total de una persona y el Rango de resultado en el que caía, con un texto asociado
(ver ADR 0002). Ahora lo que importa son las **respuestas individuales**: qué contestó cada
Empleado en cada Pregunta, y cómo evoluciona eso entre Campañas (ver ADR 0004).

Bajo el modelo anterior:

- Cada Evaluación tenía Rangos contiguos y exhaustivos con un texto de resultado, y el Envío
  guardaba `total_points` + `score_range_id` + copia del `result_text`.
- La Respuesta guardaba solo el FK a la Opción elegida (`question_option_id`) o el valor de
  texto crudo. **No** guardaba una copia del texto de la Pregunta ni de la Opción.

Ese modelo tiene dos problemas para el nuevo objetivo:

1. Los Rangos y sus textos dejan de usarse: la devolución ya no clasifica por banda ni
   muestra un texto interno por rango.
2. La comparación de respuestas individuales a lo largo del tiempo exige que el texto de la
   Pregunta y de la Opción elegida sea estable. Como la Respuesta solo guardaba FKs, editar o
   re-sembrar una Evaluación (cambiar un label, reordenar Opciones) reescribiría
   retroactivamente lo que muestra una comparación de una Campaña ya cerrada.

## Decisión

**Se eliminan los Rangos de resultado** y toda la maquinaria asociada:

- Se quitan la tabla `score_ranges`, el modelo `ScoreRange`, el `RangeCoverageValidator`, el
  `ScoreRangeController` y su pantalla de edición de rangos.
- El `ScoringService` deja de mapear a un Rango y de copiar un texto de resultado.

**El puntaje se conserva como total numérico**, sin banda ni texto:

- Una Evaluación puede tener puntaje (Preguntas de opción con puntos) o ser puramente
  informativa. Cuando tiene puntaje, produce un **Total de la Evaluación** = suma de los
  puntos de las Opciones elegidas.
- El Envío expone además un **Total general** = suma de los Totales de Evaluación.
- Se **mantiene** `submission_results`, ahora reducida a `(submission_id, evaluation_id,
  total_points)`: congela el total por Evaluación al momento del Envío. Se elimina
  `score_range_id` y `result_text`. Solo se crean filas para Evaluaciones puntuadas.

**El snapshot baja al nivel de Respuesta.** En `submission_answers`, además del FK a la Opción
y el `value_text`, cada Respuesta congela al momento del Envío:

- `question_label` — el texto de la Pregunta.
- `question_type` — el tipo de Pregunta.
- `option_label` — el texto de la Opción elegida (null si no es de opción).
- `option_points` — los puntos de la Opción elegida (null si no es de opción).

La alineación de "la misma Pregunta" entre Campañas se ancla al `question_id`; los textos
mostrados provienen del snapshot, de modo que una comparación de una Campaña pasada nunca
muta aunque después se edite la Evaluación.

## Consecuencias

- La devolución muestra respuestas individuales agrupadas por Evaluación, con el Total por
  Evaluación (donde haya puntaje) y el Total general. Nunca un rango ni un texto de resultado.
- Los datos históricos de respuestas son inmutables: editar o re-sembrar una Evaluación no
  altera lo que muestran las Campañas ya respondidas.
- Se paga un costo de almacenamiento menor por duplicar `question_label`/`option_label` en
  cada Respuesta (aceptable, mismo criterio que el snapshot original del ADR 0002).
- Desaparece la validación de cobertura de Rangos y la restricción "no editar Rangos con
  Campaña abierta" (ADR 0002): ya no hay Rangos que proteger.
- El reporte de uso agregado por rango (que contaba Envíos por `result_text`) se elimina; no
  se reemplaza en esta iteración.
- El `WellbeingSeeder` deja de sembrar Rangos; las Evaluaciones informativas quedan sin
  puntaje y no generan `submission_results`.
