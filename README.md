# ticket-ai-demo
Aplicación demo dockerizada con las tecnologías, React + C# + Oracle + python + IA

- React (Frontend)
- C# / ASP.NET Core (Backend API)
- Python (Integración con IA)
- Oracle Database
- Docker / Docker Compose (para facilitar ejecución local)

El objetivo de este proyecto es demostrar la integración entre **C#, Python e IA externa**, permitiendo crear tickets que son analizados automáticamente para determinar:

- Categoría
- Prioridad
- Resumen del problema

---

# Arquitectura

Flujo de la aplicación:

React  
↓  
ASP.NET Core API (C#)  
↓  
Python (capa de integración IA)  
↓  
Proveedor de IA externa (o fallback local)  
↓  
Oracle Database

El backend en **C# es el orquestador principal** del sistema.

Python se utiliza específicamente para la capa de análisis con IA.

---

# Funcionalidades

El sistema permite:

- Crear tickets desde una interfaz React
- Guardar tickets en Oracle
- Analizar automáticamente el contenido del ticket
- Determinar categoría y prioridad
- Generar un resumen del problema

Si la API de IA externa no está disponible o no tiene cuota, el sistema utiliza un **mecanismo de fallback local** para seguir funcionando.

---

# Requisitos

Para ejecutar la demo se necesita:

- Docker
- Docker Compose

Dentro del directorio princiopal: 
- docker compose down
- docker compose up --build

No se requieren instalaciones adicionales de Node, .NET o Python.



---

Los siguientes ejemplos pueden cargarse desde la interfaz o mediante la API.

Ejemplo 1 — Problema de autenticación

Título: Error login
Descripción: No puedo iniciar sesión en el sistema desde esta mañana. El sistema muestra que el usuario o la contraseña son incorrectos pero estoy seguro de que los datos son correctos.

Ejemplo 2 — Problema de pagos

Título: Error procesando pago
Descripción: Intento realizar un pago con tarjeta pero el sistema queda cargando y luego muestra un error. Probé con dos tarjetas diferentes y ocurre lo mismo.

Ejemplo 3 — Bug en interfaz

Título: Pantalla congelada al guardar
Descripción: Cuando intento guardar un formulario la página queda congelada y debo recargar el navegador para continuar.

Ejemplo 4 — Problema de rendimiento

Título: Sistema muy lento
Descripción: Desde ayer el sistema está extremadamente lento. Cargar una página tarda más de 20 segundos y a veces aparece un error de timeout.

Ejemplo 5 — Problema de permisos

Título: No puedo acceder a reportes
Descripción: Mi usuario debería tener acceso al módulo de reportes pero el sistema indica que no tengo permisos suficientes.

Ejemplo 6 — Problema con archivo

Título: Error al subir archivos
Descripción: Intento subir un archivo PDF al sistema pero aparece un error indicando que el archivo no puede procesarse.

Ejemplo usando la API

# Prueba por API:

POST /api/tickets
{
  "title": "Error login",
  "description": "No puedo iniciar sesión en el sistema"
}
Qué resultado deberían ver

# El sistema analizará el ticket y devolverá algo como:

{
  "message": "Ticket creado y analizado correctamente",
  "category": "Autenticación",
  "priority": "Media",
  "summary": "El usuario reporta un problema relacionado con el acceso o inicio de sesión."
}

# Nota importante

Si no se configura una API Key de IA o si el proveedor externo no tiene cuota disponible, el sistema utiliza un mecanismo de fallback local para clasificar el ticket y mantener el flujo de la demo funcionando.