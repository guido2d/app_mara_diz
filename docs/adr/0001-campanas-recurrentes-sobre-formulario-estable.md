# 1. Campañas recurrentes sobre un Formulario estable

Fecha: 2026-06-30
Estado: Aceptado

## Contexto

El bienestar de los empleados se mide de forma recurrente (trimestral, semestral) para
observar su evolución. Un Formulario público captura datos de perfil del Empleado y las
Respuestas a las Preguntas de una o varias Evaluaciones. Cada Envío debe ser único por
empleado para no contar duplicados.

Había dos formas de modelar la recurrencia:

- **Un Formulario nuevo por cada toma** (p. ej. "Bienestar 2026", "Bienestar 2027"),
  reutilizando las mismas Evaluaciones. La unicidad sería por (email, Formulario) y el link
  público cambiaría en cada toma.
- **Un Formulario estable con Campañas** recurrentes. La unicidad sería por
  (email, Campaña) y el link público del Formulario se mantendría fijo entre tomas.

## Decisión

Un Formulario es estable y persiste entre tomas. Cada toma es una **Campaña**: la crea el
admin a mano con un nombre y una ventana de fechas (`fecha_inicio`, `fecha_fin`), y solo
acepta Envíos dentro de esa ventana.

- Un Envío es único por **(email laboral, Campaña)**; un reenvío del mismo email a la misma
  Campaña se **bloquea** con un aviso de "ya respondiste".
- El Formulario está **activo** exactamente cuando tiene una Campaña abierta. Abrir una
  Campaña activa el Formulario; cerrarla (por fecha o a mano) lo desactiva.
- Puede haber **como máximo una Campaña abierta por Formulario** a la vez.
- El **link público es estable por Formulario** (`/f/{slug}`) y resuelve a la Campaña abierta;
  si no hay ninguna abierta, muestra "no disponible".

## Consecuencias

- El link se distribuye una sola vez y sirve para todas las tomas futuras.
- Los datos de cada toma quedan naturalmente aislados por Campaña, lo que habilita reportes
  de uso y comparación temporal entre Campañas.
- Se agrega la tabla de Campañas y toda consulta de Envíos/resultados se ancla a una Campaña.
- La restricción "una sola Campaña abierta por Formulario" debe validarse al crear/abrir una
  Campaña.
- No hay recurrencia automática (scheduler): la apertura de cada Campaña es una acción manual
  del admin.
