# Devolución comparativa por Empleado — Plan de migración

> Refactor sobre código ya existente (el plan greenfield `2026-06-30-app-bienestar.md` ya está
> implementado). Este plan aplica el cambio de dominio de los ADR 0003 y 0004: se eliminan los
> Rangos, el snapshot baja al nivel de Respuesta y se agrega la devolución comparativa por
> Empleado a través de Campañas. Ver `CONTEXT.md`, `docs/adr/0003`, `docs/adr/0004`.

**Objetivo:** Que la administración pueda, dentro de un Formulario, elegir un Empleado (por email
normalizado) y comparar sus Respuestas individuales campaña por campaña, agrupadas por Evaluación,
con Total por Evaluación (donde puntúe) y Total general. Sin rangos ni textos de resultado.

**Baseline:** 46 tests verdes al iniciar. Cada fase corre `php artisan test --compact` y
`vendor/bin/pint --dirty --format agent`. Sin git: apoyarse en los tests.

---

## Fase A — Esquema (migraciones aditivas)

- `..._add_snapshot_columns_to_submission_answers`: agrega `question_label` (string),
  `question_type` (string), `option_label` (string, nullable), `option_points` (int, nullable).
- `..._drop_range_columns_from_submission_results`: elimina `score_range_id` (FK) y `result_text`.
- `..._drop_score_ranges_table`: elimina la tabla `score_ranges`.
- `..._index_submissions_work_email`: índice sobre `work_email` para el listado/búsqueda cruzada.

Actualiza `SubmissionSchemaTest` y `CatalogSchemaTest` (ya no existe `score_ranges`).

## Fase B — Modelos

- `SubmissionAnswer`: fillables + casts para los 4 campos de snapshot (`question_type` → enum,
  `option_points` → int).
- `SubmissionResult`: quita `score_range_id`/`result_text` de fillable; elimina relación `scoreRange()`.
- `Evaluation`: elimina relación `scoreRanges()`; agrega `isScored(): bool` (tiene alguna Pregunta
  puntuada). `maxPossiblePoints()` se conserva.
- `ScoreRange` (modelo): eliminar.
- `Submission`: normaliza `work_email` (trim + minúsculas) al setear; helper `form()` vía campaña.

## Fase C — Servicios

- Eliminar `RangeCoverageValidator` (+ test) y `CampaignReport` (+ test).
- `ScoringService::computeAndStore`: por cada Evaluación **puntuada** del Formulario, suma
  `option_points` de las Respuestas snapshot y crea `SubmissionResult(total_points)`. Sin rango/texto.

## Fase D — Envío público (snapshot por Respuesta)

- `PublicFormController@store`: al crear cada `SubmissionAnswer`, congelar `question_label`,
  `question_type`, y para opciones el `option_label`/`option_points` de la Opción elegida.
- `StoreSubmissionRequest`: normalizar `work_email` en `prepareForValidation` (o vía mutator del modelo).
- Actualiza `PublicFormStoreTest` (asserts de snapshot + email normalizado + bloqueo por email normalizado).

## Fase E — Eliminar rangos y reportes

- Borrar `ScoreRangeController`, `ReportController`; rutas `evaluations.ranges.*` y `campaigns.report`.
- Borrar páginas `admin/ranges/edit.tsx`, `admin/reports/index.tsx`.
- `campaigns/index.tsx`: quitar link "Reporte".
- Borrar tests `ScoreRangeEditTest`, `CampaignReportTest`.
- `ResultController` + `admin/results/{index,show}.tsx`: quitar `result_text` (mostrar solo Total).
- Ajustar `ResultViewTest`.
- Seeders: quitar los bloques `scoreRanges()->createMany(...)`.
- Ajustar `SeedersTest`, `EvaluationModelTest` (sin `ScoreRange`).

## Fase F — Devolución comparativa

- `Admin/EmployeeComparisonController`:
  - `index(Form $form)` → `admin/employees/index`: empleados (por email normalizado) que
    respondieron alguna campaña del formulario, con conteo de campañas respondidas.
  - `show(Form $form)` con `?email=` → `admin/employees/show`: matriz. Filas = Preguntas agrupadas
    por Evaluación; columnas = todas las campañas (orden `starts_at`), "no respondió" donde falte;
    celdas = snapshot (opción `label (points)` o `value_text`); pie por Evaluación = Total; Total
    general por campaña; encabezado = perfil del Envío más reciente.
- Rutas `admin.forms.employees.index` y `admin.forms.employees.show`.
- Link "Comparativo por empleado" desde `admin/forms/index.tsx` (o cabecera de campañas).
- Páginas React `admin/employees/index.tsx` y `admin/employees/show.tsx`.
- Tests `Admin/EmployeeComparisonTest`.

## Fase G — Cierre

- `php artisan test --compact` verde. `vendor/bin/pint --dirty`. `npm run build`.
- `php artisan migrate` sobre la DB de desarrollo (mysql `maradiz`).
