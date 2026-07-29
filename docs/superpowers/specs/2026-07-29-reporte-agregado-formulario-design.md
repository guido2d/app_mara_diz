# Diseño — Reporte agregado por formulario

**Fecha:** 2026-07-29
**Estado:** Aprobado para plan de implementación
**Stack:** Laravel 13 · Inertia 3 · React (TSX) · Tailwind v4 (design system propio "Atelier Glass")

## Problema

Hoy los resultados solo se pueden leer de a una persona: `admin/employees/show` compara las respuestas de un empleado campaña por campaña. No existe ninguna vista que responda la pregunta a nivel organización: **¿la empresa mejoró entre una toma y la siguiente?**

Los datos para responderla ya están (`submission_answers` guarda `option_points` como snapshot por respuesta), pero nadie los agrega.

## Objetivo

Un reporte por formulario que muestre, para cada evaluación y cada pregunta seleccionada, el **promedio de puntos por campaña** en gráficos de barras, de modo que la evolución entre tomas se lea de un vistazo.

Se arranca por **Síntomas psíquicos** con 12 preguntas curadas. La estructura es genérica: las otras tres evaluaciones (Síntomas físicos, Conductas y hábitos saludables, Síntomas o enfermedades) se suman marcando sus preguntas, sin escribir código nuevo.

## Decisiones tomadas

| Decisión | Resolución |
|---|---|
| Alcance | **Agregado por formulario** (toda la gente), no individual. La vista individual ya existe. |
| Métrica de la barra | **Promedio de puntos** por pregunta y campaña, escala 0–3. |
| Población | **Todos los que respondieron cada campaña**, aunque no sean las mismas personas entre tomas. Se muestra el N de cada campaña. |
| Selección de preguntas | Columna `report_position` en `questions`: `null` = fuera del reporte, número = orden. |
| Librería de gráficos | **Ninguna.** Barras con divs + Tailwind. Sin dependencias nuevas. |
| Acción principal del formulario | **Campañas**, con el resto en un split button. |
| Acceso | Ítem "Reportes" en el menú superior + acción en la fila del formulario. |

## Fuera de alcance (YAGNI)

- Demografía en la información general (edad promedio, distribución por sexo).
- Exportar a PDF.
- Filtro por rango de campañas.
- Cohorte fija (solo quienes respondieron todas las campañas) y su toggle.
- UI de admin para elegir qué preguntas van al reporte. Se cargan por seeder; si más adelante hace falta editarlas, la columna ya está.

---

## Arquitectura

### 1. Modelo de datos

**Migración A** — `add_report_position_to_questions_table`

```php
$table->unsignedSmallInteger('report_position')->nullable()->after('position');
```

`null` = la pregunta no aparece en el reporte. Un número = su orden dentro del reporte de su evaluación. Deliberadamente independiente de `position` (el orden en el formulario público), porque el orden pedido para el reporte no coincide: la pregunta 19 va antes que la 18.

**Migración B** — `add_lower_is_better_to_evaluations_table`

```php
$table->boolean('lower_is_better')->default(true)->after('is_scored');
```

Define en qué dirección apunta una mejora. En Síntomas psíquicos y Síntomas físicos, más puntos = peor (`true`). En **Conductas y hábitos saludables**, más puntos = mejor (`false`). Sin esta columna, el verde y el rojo del delta quedarían invertidos en esa evaluación.

**Seeder** — marca las 12 preguntas de Síntomas psíquicos con `report_position` 1..12, mapeadas desde su `position` en el orden pedido:

| `report_position` | `position` | Pregunta |
|---|---|---|
| 1 | 1 | Que no tiene tiempo suficiente y que nunca va a llegar |
| 2 | 3 | Que no va a poder, que va a fallar. Teme fracasar en algo |
| 3 | 4 | Tener preocupaciones persistentes |
| 4 | 6 | Vivir pensando en tareas futuras en lugar de disfrutar el presente |
| 5 | 12 | Comenzar a cometer cada vez más excesos con el cigarrillo, el alcohol, el café o psicofármacos |
| 6 | 16 | Estar más impulsivo/a, agresivo/a o insatisfecho/a que lo usual |
| 7 | 19 | Disminuye su capacidad afectiva o para relacionarse |
| 8 | 18 | Sentirse angustiado/a o tener un nudo en la garganta |
| 9 | 20 | Que aumentan sus conflictos interpersonales |
| 10 | 21 | Que crecen sus dificultades para concentrarse en lo que necesita |
| 11 | 22 | Que crecen sus problemas de memoria |
| 12 | 23 | Que baja la calidad de su trabajo y/o rendimiento |

El seeder también fija `lower_is_better = false` en Conductas y hábitos saludables.

**Modelo `Question`** — scope nuevo:

```php
/** @param Builder<Question> $query */
public function scopeInReport(Builder $query): void
{
    $query->whereNotNull('report_position')->orderBy('report_position');
}
```

**Modelo `Evaluation`** — cast de `lower_is_better` a boolean y accesor `lowerIsBetter(): bool`, siguiendo el patrón de `isScored()` y `allowsRowMarks()`.

### 2. Backend

**Rutas** (en `routes/admin.php`, dentro del grupo `auth`):

```php
Route::get('reports', [ReportBoardController::class, 'index'])->name('reports.index');
Route::get('comparativo', [ComparisonBoardController::class, 'index'])->name('comparativo.index');
Route::get('forms/{form}/report', [FormReportController::class, 'show'])->name('forms.report');
```

**`FormReportController@show`** — arma el reporte con dos queries agregadas, sin N+1.

Promedios por pregunta y campaña:

```sql
SELECT s.campaign_id, sa.question_id,
       AVG(sa.option_points) AS average, COUNT(*) AS answers
FROM submission_answers sa
JOIN submissions s ON s.id = sa.submission_id
WHERE s.campaign_id IN (:campaigns) AND sa.question_id IN (:questions)
GROUP BY s.campaign_id, sa.question_id
```

Promedio del puntaje total por evaluación y campaña:

```sql
SELECT s.campaign_id, sr.evaluation_id, AVG(sr.total_points) AS average
FROM submission_results sr
JOIN submissions s ON s.id = sr.submission_id
WHERE s.campaign_id IN (:campaigns)
GROUP BY s.campaign_id, sr.evaluation_id
```

**Orden de las campañas: por `created_at`**, igual que `EmployeeComparisonController::show`. En los datos actuales las fechas de inicio están desordenadas (la "Tercera toma" del formulario 1 arranca antes que la "Segunda"), así que ordenar por `starts_at` produciría un eje temporal incorrecto.

**Qué evaluaciones se incluyen:** las del formulario que tengan al menos una pregunta con `report_position`. Si ninguna la tiene, el reporte devuelve la lista vacía y la vista muestra un estado vacío.

**Casos borde:**

| Caso | Resultado |
|---|---|
| Campaña sin respuestas | `average: null`, `answers: 0`. La vista muestra "sin respuestas", nunca una barra en 0 — un 0 se leería como el mejor puntaje posible. |
| Pregunta que una campaña no incluía | `average: null` para esa celda, rotulada "no aplicaba". |
| Formulario sin campañas | Estado vacío. |
| Formulario sin preguntas marcadas | Estado vacío explicando que hay que marcarlas. |
| División para el delta con base `null` | Sin delta, se muestra `—`. |

**Forma de los props enviados a Inertia:**

```
form: { id, name, description }
campaigns: [{ id, name, starts_at, ends_at, is_open, submissions_count }]
participants_count: int          // personas únicas por work_email
evaluations: [{
    id, name, lower_is_better,
    totals: [{ campaign_id, average: float|null }],
    questions: [{
        id, label,
        values: [{ campaign_id, average: float|null, answers: int }]
    }]
}]
```

**`ReportBoardController@index` y `ComparisonBoardController@index`** — controladores finos (≈10 líneas) que listan los formularios con `campaigns_count` y cantidad de respuestas, y renderizan la **misma** página React con un destino distinto.

### 3. Frontend

**Página nueva** — `resources/js/pages/admin/reports/show.tsx`

Estructura, usando `GlassCard` y los tokens de Atelier Glass (`ink`, `ink-50`, `indigo`, `font-display`, labels en `font-mono` mayúsculas):

1. **Breadcrumbs**: Formularios → {nombre} → Reporte.
2. **Card "Información general"**: nombre y descripción del formulario, cantidad de participantes únicos, y tabla de campañas con fechas, respuestas y estado. Sin el N de cada campaña un promedio no se puede interpretar, así que este bloque no es decorativo.
3. **Una `GlassCard` por evaluación**:
   - Encabezado con el puntaje total promedio en cada campaña y su variación porcentual.
   - Leyenda de campañas.
   - Las preguntas en orden de `report_position`, cada una con su grupo de barras.

**Componente nuevo** — `resources/js/components/ui/bar-chart.tsx`

`GroupedBars` recibe las series de una pregunta y renderiza barras horizontales con divs. Reglas:

- **Escala fija 0–3** en todas las preguntas del reporte. Si cada gráfico se autoescalara, una pregunta con promedio 0.4 se vería tan grave como una de 2.8, y el largo de la barra dejaría de significar lo mismo entre gráficos.
- **Color por campaña en tonos de indigo**, del más claro (más antigua) al más oscuro (más reciente), para que la progresión temporal se lea sin consultar la leyenda.
- **Delta contra la campaña anterior** al costado de cada barra, expresado en **puntos absolutos** con un decimal (p. ej. `▼ 0.8`), no en porcentaje: sobre una escala de 0 a 3, un porcentaje sobre bases chicas exagera la variación. El porcentaje se reserva para el puntaje total de la evaluación, donde la base es grande. El color sale de `lower_is_better`: verde siempre significa "mejoró", en cualquier evaluación.
- Barras con `role="img"` y `aria-label` describiendo campaña y valor.

**Componente nuevo** — `resources/js/components/ui/split-button.tsx`

Acción principal (`Link`) pegada a un botón con caret que despliega las secundarias. Reutiliza el patrón de dropdown que ya existe en `admin-shell.tsx`: `useRef` + listener de `mousedown` para cerrar al hacer click afuera, `aria-haspopup="menu"`, `aria-expanded`, y cierre con Escape. Se usa igual en la tabla desktop y en la tarjeta mobile.

**Página nueva** — `resources/js/pages/admin/forms/picker.tsx`

Listado de formularios compartido por Reportes y Comparativo. Recibe `{ title, description, forms, action }`, donde `action` es la base de URL a la que enlaza cada fila.

**Cambios en archivos existentes:**

- `resources/js/pages/admin/forms/index.tsx` — `FormActions` pasa de cuatro links sueltos a un `SplitButton`: **Campañas** como acción principal, y Reporte / Comparativo / Editar en el desplegable.
- `resources/js/config/nav.ts` — se agrega `{ label: 'Reportes', href: '/admin/reports' }` y **Comparativo cambia** de `/admin/forms/1/employees` a `/admin/comparativo`. El ID fijo actual tira 404 si se borra el formulario 1.

## Tests (Pest)

En `tests/Feature/Admin/FormReportTest.php`:

1. El reporte incluye únicamente las preguntas con `report_position`, y en ese orden.
2. El promedio por campaña se calcula sobre todas las respuestas de esa campaña.
3. Campaña sin respuestas devuelve `average: null` y `answers: 0`, no `0`.
4. Pregunta que una campaña no incluía devuelve `average: null` en esa celda.
5. El delta se marca como mejora en el sentido correcto según `lower_is_better` (una baja de puntos mejora en Síntomas psíquicos y empeora en Conductas y hábitos saludables).
6. Las campañas salen ordenadas por `created_at`, no por `starts_at`.
7. Un formulario sin preguntas marcadas devuelve la lista de evaluaciones vacía.
8. La ruta requiere autenticación.

En `tests/Feature/Admin/ReportBoardTest.php`:

9. El índice de Reportes lista los formularios con su cantidad de campañas y respuestas.
10. El índice de Comparativo responde 200 sin depender de ningún ID fijo.

## Notas de implementación

- Correr `vendor/bin/pint --dirty --format agent` sobre los PHP modificados.
- Correr `npm run build` al terminar el frontend (requisito del CLAUDE.md del proyecto).
- Las páginas React existentes usan URLs como strings, no helpers de Wayfinder. Se sigue esa convención por consistencia.
