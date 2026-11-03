# Pruebas del microservicio Disponibilidad

**Responsable:** ROBERTO ISRAEL MEZA ORORE
**Puerto:** 3003 · **Comando:** `docker compose exec disponibilidad npm test`

| Microservicio | Prueba | Qué verifica | Resultado esperado |
|---|---|---|---|
| Disponibilidad | GET /health responde que el servicio está activo | El servicio responde | 200 y `servicio: disponibilidad` |
| Disponibilidad | GET /disponibilidad filtra por experiencia y fecha | Consulta con filtros | 200 y una sola fila con la fecha pedida |
| Disponibilidad | POST /reservar descuenta cupos y /liberar los devuelve | Control de cupos | Los cupos libres bajan en 1 y luego vuelven |
| Disponibilidad | POST /reservar responde 409 si no alcanzan los cupos | **Prevención de sobrerreservas** | 409 "Sin cupos suficientes" |
| Disponibilidad | POST /reservar responde 404 si no hay cupos para la fecha | Fecha sin disponibilidad registrada | 404 |
| Disponibilidad | POST /reservar rechaza datos incompletos | Validación de datos | 400 |

## Ejecución de las pruebas

<img width="299" height="121" alt="Captura de pantalla 2026-11-03 114546" src="https://github.com/user-attachments/assets/aa321789-1a16-4eff-bb22-258b35d19975" />


## Prueba manual de la API

<img width="503" height="202" alt="Captura de pantalla 2026-11-03 114624" src="https://github.com/user-attachments/assets/255c22ee-d00a-4a3c-bd04-4559e12b795c" />
