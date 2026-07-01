# Bienestar

Aplicación para tomar evaluaciones sobre el bienestar de los empleados de una organización. Un empleado completa un formulario público; la administración configura y analiza los resultados.

## Language

**Formulario**:
Lo que un empleado completa públicamente. Se compone de 1 o varias Evaluaciones y de un conjunto de campos de datos personales que arman el perfil del Empleado. Tiene ABM en el panel de administración. Está activo (acepta Envíos por su link público) únicamente cuando tiene una Campaña abierta.
_Avoid_: Encuesta, cuestionario

**Campaña**:
Cada toma recurrente de un mismo Formulario (p. ej. "Q1 2026"). La crea el admin a mano con un nombre y una ventana de fechas (`fecha_inicio`, `fecha_fin`); acepta Envíos solo dentro de esa ventana. Abrir una Campaña es lo que "activa" el Formulario; cerrarla (por fecha o a mano) lo desactiva.
_Avoid_: Período, edición, ventana

**Evaluación**:
Una plantilla reutilizable de preguntas sobre un aspecto del bienestar, con su propio esquema de puntaje y rangos de resultado. Es la unidad que se puntúa y para la que se configuran los textos de resultado. Se compone dentro de uno o varios Formularios.
_Avoid_: Encuesta, test

**Empleado**:
La persona que completa un Formulario. Su perfil (nombre, apellido, función, edad, sexo, estado civil, cantidad de hijos, grupo de convivencia, email laboral, celular) NO forma parte de ninguna Evaluación y se guarda como snapshot en cada Envío. No hay un padrón maestro de empleados: el email laboral es la clave que vincula los Envíos de una misma persona a través de Campañas.
_Avoid_: Usuario, participante

**Pregunta**:
Un ítem de una Evaluación. Existe solo en base de datos (sin ABM). Tiene un tipo de respuesta: input (texto), select (desplegable), radio (múltiple choice), date (fecha) o textarea (descripción).

**Opción**:
Una alternativa elegible de una Pregunta de tipo select o radio. Lleva el puntaje (`points`): al elegirla, ese valor suma al resultado de la Evaluación. Las Preguntas de texto, fecha y descripción no tienen Opciones y no puntúan.

**Envío**:
El acto completo de un Empleado completando un Formulario público dentro de una Campaña: incluye sus datos de perfil y todas las Respuestas a las Preguntas de las Evaluaciones que componen el Formulario. Es único por (email laboral, Campaña): si ese email ya envió esa Campaña, se bloquea con un aviso de "ya respondiste". Produce un resultado por cada Evaluación del Formulario.
_Avoid_: Intento, submission

**Respuesta**:
Lo que un Empleado contesta a una Pregunta dentro de un Envío. Para Preguntas de opción, referencia la Opción elegida (que aporta su puntaje); para texto/fecha/descripción, guarda el valor ingresado (sin puntaje).

**Rango de resultado**:
Un intervalo de puntaje de una Evaluación con su texto asociado. El resultado de una Evaluación es la suma de los puntajes de las Opciones elegidas, ubicada en el Rango que la contiene. Los Rangos de una Evaluación son contiguos, sin solapes ni huecos, y cubren de 0 al puntaje máximo posible. El texto es interno (análisis del admin): el Empleado no lo ve, solo recibe una pantalla de agradecimiento. Configurable en el panel de administración.
_Avoid_: Banda, nivel
