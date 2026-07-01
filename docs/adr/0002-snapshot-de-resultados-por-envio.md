# 2. Snapshot de resultados por Envío

Fecha: 2026-06-30
Estado: Aceptado

## Contexto

Las Evaluaciones son reutilizables y editables: el admin puede cambiar el puntaje de las
Opciones, mover los Rangos de resultado o reescribir sus textos. Al mismo tiempo, cada
Envío queda archivado por Campaña y sus resultados alimentan reportes que se consideran
cerrados. Editar una Evaluación no debe corromper resultados ya emitidos.

Alternativas:

- **Recálculo en vivo**: guardar solo la Opción elegida y computar total, Rango y texto al
  vuelo. Editar puntajes/rangos reescribe retroactivamente toda la historia.
- **Snapshot**: congelar el resultado en el momento del Envío.

## Decisión

Al momento del Envío, por cada Evaluación del Formulario se calcula y **guarda** un snapshot
del resultado: total de puntos, `score_range_id` alcanzado y una **copia del texto** de
resultado mostrado. También se guarda la Opción elegida cruda de cada Respuesta, para
auditoría o reprocesamiento eventual.

Editar una Evaluación después no altera los Envíos ya realizados; solo afecta Campañas
futuras. Como complemento, **no se puede editar una Evaluación que participa en una Campaña
abierta** (ver que toda una Campaña se mida con las mismas reglas): la edición requiere que
sus Campañas estén cerradas.

## Consecuencias

- Los resultados históricos son inmutables; los reportes de una Campaña cerrada no mutan.
- Se duplica el texto de resultado en cada snapshot (costo de almacenamiento menor, aceptable).
- Guardar la Opción cruda además del snapshot permite auditar y reprocesar si se detecta un
  error.
- Se necesita una validación que impida editar una Evaluación con Campañas abiertas.
