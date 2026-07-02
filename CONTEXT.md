# Bienestar

Aplicación para tomar evaluaciones sobre el bienestar de los empleados de una organización. Un empleado completa un formulario público; la administración configura las tomas y analiza las respuestas, comparando cómo evoluciona cada persona a lo largo de las campañas.

## Language

**Formulario**:
Lo que un empleado completa públicamente. Se compone de 1 o varias Evaluaciones y de un conjunto de campos de datos personales que arman el perfil del Empleado. Tiene ABM en el panel de administración. Está activo (acepta Envíos por su link público) únicamente cuando tiene una Campaña abierta.
_Avoid_: Encuesta, cuestionario

**Campaña**:
Cada toma recurrente de un mismo Formulario (p. ej. "Q1 2026"). La crea el admin a mano con un nombre y una ventana de fechas (`fecha_inicio`, `fecha_fin`); acepta Envíos solo dentro de esa ventana. Abrir una Campaña es lo que "activa" el Formulario; cerrarla (por fecha o a mano) lo desactiva. Las Campañas de un Formulario forman una línea de tiempo ordenada por `fecha_inicio`: la primera toma, la segunda, etc.
_Avoid_: Período, edición, ventana

**Evaluación**:
Una plantilla reutilizable de preguntas sobre un aspecto del bienestar. Puede tener puntaje (Preguntas de opción con puntos) o ser puramente informativa. Es la unidad por la que se agrupan las Respuestas en la devolución. Cuando tiene puntaje, produce un Total de la Evaluación (número); **no** tiene rangos ni textos de resultado. Se compone dentro de uno o varios Formularios.
_Avoid_: Encuesta, test

**Empleado**:
La persona que completa un Formulario. Su perfil (nombre, apellido, función, edad, sexo, estado civil, cantidad de hijos, grupo de convivencia, email laboral, celular) NO forma parte de ninguna Evaluación y se guarda como snapshot en cada Envío. No hay un padrón maestro de empleados: el **email laboral normalizado** (trim + minúsculas) es la clave que identifica a la persona y vincula sus Envíos a través de las Campañas de un mismo Formulario. Su perfil puede diferir entre Campañas; en la devolución comparativa se muestra el del Envío más reciente.
_Avoid_: Usuario, participante, consultante

**Pregunta**:
Un ítem de una Evaluación. Existe solo en base de datos (sin ABM). Tiene un tipo de respuesta: input (texto), select (desplegable), radio (múltiple choice), date (fecha) o textarea (descripción).

**Opción**:
Una alternativa elegible de una Pregunta de tipo select o radio. Lleva el puntaje (`points`): al elegirla, ese valor suma al Total de la Evaluación. Las Preguntas de texto, fecha y descripción no tienen Opciones y no puntúan.

**Envío**:
El acto completo de un Empleado completando un Formulario público dentro de una Campaña: incluye sus datos de perfil y todas las Respuestas a las Preguntas de las Evaluaciones que componen el Formulario. Es único por (email laboral normalizado, Campaña): si ese email ya envió esa Campaña, se bloquea con un aviso de "ya respondiste". Produce un Total por cada Evaluación puntuada del Formulario (sin rango ni texto).
_Avoid_: Intento, submission

**Respuesta**:
Lo que un Empleado contesta a una Pregunta dentro de un Envío. Para Preguntas de opción, referencia la Opción elegida (que aporta su puntaje); para texto/fecha/descripción, guarda el valor ingresado (sin puntaje). Además **congela (snapshot)** el texto de la Pregunta y, si es de opción, el texto y los puntos de la Opción elegida al momento del Envío, para que la comparación histórica entre Campañas no mute si luego se edita o re-siembra la Evaluación.

**Total de la Evaluación**:
La suma de los puntos de las Opciones elegidas en las Preguntas puntuadas de una Evaluación dentro de un Envío. Se congela como snapshot en el Envío. Solo existe para Evaluaciones con puntaje; las informativas no lo tienen.
_Avoid_: Puntaje, score

**Total general**:
La suma de los Totales de Evaluación de un Envío. Se muestra junto a la devolución del Envío.

**Devolución comparativa**:
La vista de administración que agrupa los Envíos de un mismo Empleado (por email normalizado) dentro de un Formulario y compara sus Respuestas individuales, campaña por campaña. Las Respuestas se agrupan por Evaluación; las Campañas son la línea de tiempo (columnas), incluidas aquellas donde el Empleado no respondió. No se muestran rangos ni textos de resultado: importan las respuestas individuales y, donde haya puntaje, los Totales.
_Avoid_: Reporte, informe por rango
