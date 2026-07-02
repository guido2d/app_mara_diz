# 4. Devolución comparativa por Empleado a través de Campañas

Fecha: 2026-07-01
Estado: Aceptado

## Contexto

El objetivo de la administración pasa a ser observar la **evolución de una misma persona**:
ver todas las Respuestas de un Empleado en la primera toma de un Formulario frente a las de
las tomas siguientes. Las Campañas ya modelan esas tomas (ADR 0001) y el email laboral ya es
la clave que vincula los Envíos de una persona entre Campañas (glosario). Falta definir cómo
se identifica a la persona, qué alcance tiene la comparación y cómo se presenta.

## Decisión

**Identidad del Empleado.** La persona se identifica por su **email laboral normalizado**
(trim + minúsculas). Al guardar un Envío se persiste el email normalizado; la agrupación de
Envíos de "la misma persona" usa ese valor. No se introduce un padrón maestro ni una entidad
`Empleado` persistida: el Empleado es una agrupación derivada de los Envíos por email.

- Se mantiene el término de dominio **"Empleado"** (no "Consultante", que era solo la palabra
  del pedido).
- La unicidad del Envío sigue siendo `(campaña, email normalizado)`.

**Alcance por Formulario.** La comparación vive **dentro de un Formulario**. Como las
Evaluaciones y Preguntas dependen del Formulario, comparar entre Formularios distintos no
tiene un eje común de preguntas. Un Empleado que respondió varios Formularios se compara por
separado en cada uno.

**Presentación: índice + matriz (dos pantallas).**

1. **Índice de Empleados de un Formulario.** Lista de personas (por email normalizado) que
   respondieron alguna Campaña del Formulario, con cuántas Campañas respondió cada una. Es la
   pantalla que cumple "ver los resultados de todas las respuestas de las distintas campañas".
2. **Matriz comparativa del Empleado.** Al elegir una persona:
   - **Filas:** las Preguntas, agrupadas por Evaluación (orden por `position`).
   - **Columnas:** **todas** las Campañas del Formulario en su línea de tiempo (orden por
     `fecha_inicio`). En una Campaña donde el Empleado no respondió, la columna se marca
     como "no respondió".
   - **Celdas:** la Respuesta snapshot de esa Pregunta en esa Campaña. Para Preguntas de
     opción se muestra la etiqueta **y** los puntos de la Opción elegida (p. ej. "Siempre
     (3)"); para texto/fecha/descripción, el valor ingresado.
   - **Pie por Evaluación:** el Total de la Evaluación (solo donde haya puntaje), por Campaña.
   - **Total general** del Envío, por Campaña.
   - **Encabezado:** el perfil del Empleado tomado de su **Envío más reciente** (email como
     ancla estable), ya que el perfil puede variar entre Campañas.

## Consecuencias

- La devolución es la comparación por persona; deja de existir un informe agregado por rango.
- La comparación es robusta en el tiempo gracias al snapshot a nivel Respuesta (ADR 0003):
  cada celda muestra el texto congelado al momento del Envío.
- La alineación de filas usa `question_id`; si una Campaña incluyó una Evaluación/Pregunta que
  otra no tenía, esa fila queda vacía ("no respondió"/"no aplicaba") en las Campañas sin ella.
- Como no hay entidad `Empleado` persistida, toda consulta parte de `submissions` filtrando
  por `form` (vía `campaign.form_id`) y agrupando por email normalizado. Conviene un índice de
  base de datos sobre el email normalizado para el listado y la búsqueda.
- El perfil mostrado es el del Envío más reciente; las diferencias de perfil entre Campañas
  existen en los snapshots pero no se destacan en esta vista (decisión revisable si luego se
  quiere ver la evolución del perfil).
- Riesgo asumido: un email reutilizado por otra persona mezclaría dos personas bajo una misma
  fila. Se acepta para esta iteración (el email laboral se considera estable por persona).
