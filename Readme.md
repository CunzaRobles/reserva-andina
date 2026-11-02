# ReservaAndina

**Plataforma de reservas de turismo vivencial para comunidades del Valle Sagrado (Cusco, Perú)**

Proyecto grupal del curso **Cloud Computing** — Producto académico N.º 3.
Arquitectura basada en microservicios con Node.js, PostgreSQL, Docker, Docker Compose y GitHub Actions.

---

## Integrantes

| N.º | Integrante | Rol | Microservicio a cargo |
|---|---|---|---|
| 1 | JOSE ALEXANDRO LOPEZ MAMANI | Líder del repositorio | Por definir |
| 2 | BRANDON CUNZA ROBLES | Desarrollador | Por definir |
| 3 | ROBERTO ISRAEL MEZA ORORE | Desarrollador | Por definir |
| 4 | MARIANO JHOSHUA LAURA PAZ | Desarrollador | Por definir |
| 5 | OSCAR AILTHON ESPINOZA NIETO | Desarrollador | Por definir |

---

## 1. Contexto y problemática

**Lugar.** Comunidades rurales del Valle Sagrado de los Incas, en las provincias de Calca y Urubamba (Cusco), como las de Pisac, Chinchero, Ollantaytambo y Huilloc. Estas comunidades reciben turistas que visitan el valle camino a Machu Picchu.

**Necesidad.** Muchas familias ofrecen **turismo vivencial**: hospedaje en casa, talleres de tejido con técnicas tradicionales, gastronomía andina y labores agrícolas. Sin embargo:

- **Dependen de intermediarios** (agencias o guías), que se quedan con buena parte del pago.
- **Gestionan sus reservas por WhatsApp, llamadas o un cuaderno**, lo que causa sobrerreservas, olvidos y cancelaciones sin aviso.
- **El turista no encuentra la oferta directa** ni sabe si hay cupo para su fecha.
- **La asociación comunitaria no sabe cuánto turismo recibe** cada familia, así que no puede distribuir los turnos de forma equitativa.

### Condiciones reales de los usuarios

| Aspecto | Anfitriones (familias) | Turistas |
|---|---|---|
| Internet | Datos móviles intermitentes; señal débil en algunas zonas | Buena conexión (wifi del hotel o datos) |
| Dispositivo | Celular básico o smartphone de gama baja | Smartphone o laptop |
| Hábitos | Usan WhatsApp y llamadas; poca experiencia con apps | Acostumbrados a reservar en línea |
| Idioma | Quechua y español | Español e inglés |

**Decisiones de diseño derivadas de estas condiciones:**

- **El anfitrión no necesita instalar ni aprender una app:** recibe las reservas como mensaje (SMS o WhatsApp) y las confirma con una respuesta simple.
- **El turista usa una web ligera**, que carga rápido incluso con mala señal.
- **La asociación comunitaria** usa un panel con reportes desde una computadora del local comunal.

---

## 2. Usuarios objetivo

1. **Familias anfitrionas:** publican sus experiencias y reciben reservas.
2. **Asociación de turismo comunitario:** registra a las familias, supervisa las reservas y reparte los turnos.
3. **Turistas nacionales y extranjeros:** buscan, reservan y cancelan experiencias.

---

## 3. Propuesta de solución

Un sistema web basado en **microservicios**, donde:

1. La **asociación** registra a las familias anfitrionas y sus experiencias, con precio y capacidad.
2. Cada experiencia tiene un **calendario de cupos por fecha**.
3. El **turista** busca una experiencia, elige la fecha y el número de personas, y reserva.
4. El sistema **valida** que la experiencia exista y que haya cupos suficientes, y **descuenta los cupos**, de modo que no hay sobrerreservas.
5. El **anfitrión recibe una notificación** con los datos de la reserva.
6. La reserva puede **confirmarse o cancelarse**. Al cancelarse, los cupos se **liberan automáticamente** y se notifica al anfitrión.
7. La asociación consulta las reservas por familia y fecha.

**Beneficios:** venta directa sin intermediarios; ninguna sobrerreserva, porque los cupos se controlan automáticamente; el anfitrión trabaja con lo que ya usa (mensajes); y la asociación cuenta con un registro ordenado.

---

## 4. Microservicios

### Arquitectura general

```
                         ┌───────────────────┐
                         │      Turista      │
                         └─────────┬─────────┘
                                   │  REST
                                   ▼
┌──────────────┐  valida   ┌──────────────┐  reserva/libera cupos  ┌────────────────┐
│ Experiencias │◄──────────│   Reservas   │───────────────────────►│ Disponibilidad │
│    :3002     │           │    :3004     │                        │     :3003      │
└──────┬───────┘           └──────┬───────┘                        └────────────────┘
       │ valida anfitrión         │ envía aviso
       ▼                          ▼
┌──────────────┐           ┌────────────────┐
│ Anfitriones  │           │ Notificaciones │
│    :3001     │           │     :3005      │
└──────────────┘           └────────────────┘

Cada servicio tiene su propia base de datos PostgreSQL.
```

### Responsabilidad de cada microservicio

| Microservicio | Puerto | Responsabilidad | Se comunica con |
|---|---|---|---|
| **Anfitriones** | 3001 | Registro de las familias anfitrionas: nombre, comunidad, teléfono e idiomas | — |
| **Experiencias** | 3002 | Catálogo de experiencias: tipo, precio por persona y capacidad diaria | Anfitriones (valida que el anfitrión exista) |
| **Disponibilidad** | 3003 | Cupos por experiencia y fecha; reserva y libera cupos, y evita sobrerreservas | — |
| **Reservas** | 3004 | Crea, confirma y cancela reservas; orquesta a los demás servicios | Experiencias, Disponibilidad y Notificaciones |
| **Notificaciones** | 3005 | Registro y envío simulado de avisos por SMS o WhatsApp al anfitrión | — |

### Endpoints principales

| Microservicio | Endpoints |
|---|---|
| Anfitriones | `GET /health`, `GET /anfitriones`, `GET /anfitriones/:id`, `POST /anfitriones`, `PUT /anfitriones/:id`, `DELETE /anfitriones/:id` |
| Experiencias | `GET /health`, `GET /experiencias`, `GET /experiencias/:id`, `POST /experiencias`, `PUT /experiencias/:id`, `DELETE /experiencias/:id` |
| Disponibilidad | `GET /health`, `GET /disponibilidad?experiencia_id=&fecha=`, `POST /disponibilidad`, `POST /disponibilidad/reservar`, `POST /disponibilidad/liberar` |
| Reservas | `GET /health`, `GET /reservas`, `GET /reservas/:id`, `POST /reservas`, `PATCH /reservas/:id/confirmar`, `PATCH /reservas/:id/cancelar` |
| Notificaciones | `GET /health`, `GET /notificaciones`, `POST /notificaciones` |

### Flujo de una reserva (`POST /reservas`)

1. Reservas consulta a **Experiencias**: si la experiencia no existe, responde `400`.
2. Calcula el total: `precio × personas`.
3. Pide a **Disponibilidad** que descuente cupos: si no hay suficientes, responde `409 Sin cupos`.
4. Guarda la reserva con estado `pendiente`.
5. Pide a **Notificaciones** que avise al anfitrión.
6. Responde `201 Created`.

Al cancelar (`PATCH /reservas/:id/cancelar`), cambia el estado a `cancelada`, pide a **Disponibilidad** que libere los cupos y a **Notificaciones** que avise al anfitrión.

---

## 5. Estructura del repositorio

```
reserva-andina/
├── README.md
├── docker-compose.yml
├── .gitignore
├── .github/workflows/ci.yml
├── anfitriones/
│   ├── src/ (app.js, db.js, server.js)
│   ├── tests/app.test.js
│   ├── init.sql
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── experiencias/      (misma estructura)
├── disponibilidad/    (misma estructura)
├── reservas/          (misma estructura)
└── notificaciones/    (misma estructura)
```

---

## 6. Flujo de trabajo del equipo

- La rama `main` está protegida: los cambios solo se incorporan mediante **Pull Request** con al menos **una aprobación**.
- Cada integrante trabaja en su **fork** del repositorio central y propone sus cambios mediante Pull Request.
- El líder revisa, aprueba o solicita cambios antes de incorporar cada contribución.

---

## 7. Ejecución del proyecto

> *Sección en desarrollo: se completará con los comandos de Docker Compose y las capturas de los servicios en funcionamiento.*

---

## 8. Pruebas implementadas

> *Sección en desarrollo: se documentará cada prueba con la funcionalidad que verifica, el microservicio al que corresponde y el comportamiento esperado.*

| Microservicio | Prueba | Funcionalidad que verifica | Comportamiento esperado |
|---|---|---|---|
| | | | |

---

## 9. Integración continua

> *Sección en desarrollo: se describirá la pipeline de GitHub Actions que ejecuta las pruebas y verifica la construcción de las imágenes Docker.*
