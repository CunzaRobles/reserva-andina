# Pruebas del microservicio Experiencias

**Responsable:** BRANDON CUNZA ROBLES
**Puerto:** 3002 · **Comando:** `docker compose exec experiencias npm test`

| Microservicio | Prueba | Qué verifica | Resultado esperado |
|---|---|---|---|
| Experiencias | GET /health responde que el servicio está activo | El servicio responde | 200 y `servicio: experiencias` |
| Experiencias | GET /experiencias devuelve el catálogo | Consulta de todas las experiencias | 200 y una lista con datos |
| Experiencias | GET /experiencias/9999 responde 404 | Manejo de una experiencia inexistente | 404 "Experiencia no encontrada" |
| Experiencias | POST /experiencias rechaza un precio negativo | Validación del precio | 400 |
| Experiencias | POST /experiencias rechaza un anfitrión inexistente | **Comunicación con Anfitriones** | 400 "El anfitrión indicado no existe" |
| Experiencias | POST /experiencias registra una experiencia válida | Registro correcto (valida el anfitrión 1) | 201 y la experiencia creada |

## Ejecución de las pruebas

<img width="667" height="247" alt="image" src="https://github.com/user-attachments/assets/6d277d64-daf8-4011-af35-1613ece89cec" />


## Prueba manual de la API

<img width="1092" height="432" alt="image" src="https://github.com/user-attachments/assets/4a5291a7-5fd3-4ba1-9187-da19bd46efb6" />
