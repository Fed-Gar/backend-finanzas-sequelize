Servicio de Ventas y Gastos (Node.js + Express + Sequelize) con:

CRUD con soft delete.

Filtros por fecha (rango from/to o periodo=dia|semana|mes|anio).

Importación desde JSON.

Endpoint para dashboard (serie temporal de ventas/gastos).

Requiere JWT emitido por el servicio de Auth. Comparte la misma DB.

🚀 Ejecutar
Opción A — Docker Compose

Ejecutar desde la carpeta raíz del proyecto donde esta docker-compose.yml.

docker compose build --no-cache
docker compose up -d
docker compose logs -f finanzas

Al arrancar, este contenedor ejecuta `sequelize db:migrate` automáticamente y queda en modo dev.

El servicio escucha en http://localhost:3001.

Opción B — Local (sin Docker)
npm ci
npm run db:migrate
npm run dev

🔧 Variables de entorno

En local (archivo .env):

DATABASE_URL=postgres://fin_user:fin_pass@localhost:5432/fin_db
JWT_SECRET=super_secreto_largo_y_unico
NODE_ENV=development
PORT=3001

Con Docker Compose:

DATABASE_URL=postgres://fin_user:fin_pass@postgres:5432/fin_db

IMPORTANTE: JWT_SECRET debe coincidir con el de Auth.

📁 Estructura
src/
├─ app/
│  ├─ server.js       # Express app
│  └─ routes.js       # Rutas de ventas/gastos/dashboard/import
├─ middlewares/
│  ├─ auth.js         # Verifica JWT
│  └─ error.js        # Manejo de errores
└─ db/
   ├─ config.js       # Config Sequelize (DATABASE_URL)
   └─ models/
      ├─ index.js     # Bootstrap Sequelize
      ├─ venta.js     # Modelo ventas (paranoid)
      └─ gasto.js     # Modelo gastos (paranoid)

migrations/
├─ YYYYMMDDHHMMSS-create-ventas.js
└─ YYYYMMDDHHMMSS-create-gastos.js
postman/
├─ finanzas.postman_collection.json
└─ local.postman_evironment.json

📚 Scripts NPM
{
  "dev": "nodemon src/app/server.js",
  "start": "node src/app/server.js",
  "db:migrate": "sequelize db:migrate",
  "db:migrate:undo": "sequelize db:migrate:undo",
  "db:seed": "sequelize db:seed:all"
}

🧭 Endpoints
Salud

GET /health → sanity check.

Ventas

POST /ventas (JWT)
Body ejemplo:

{ "fecha":"2026-01-15","categoria":"servicios","monto":1500.50,"descripcion":"venta X" }


GET /ventas (JWT)
Filtros:

?from=YYYY-MM-DD&to=YYYY-MM-DD (rango libre)

?periodo=dia|semana|mes|anio (compara con la fecha actual)

?periodo=dia|semana|mes|anio&fecha=YYYY-MM-DD

?periodo=MM&anio=YYYY (mes explicito)

PUT /ventas/:id (JWT)

DELETE /ventas/:id (JWT, soft delete)

Gastos

Igual que ventas en /gastos.

Dashboard

GET /dashboard/line-chart?unit=day|month (JWT)
Retorna ventas y gastos agregados por periodo:

{
  "ventas":[{"periodo":"2026-01-10T00:00:00.000Z","total":"2900.50"}],
  "gastos":[{"periodo":"2026-01-10T00:00:00.000Z","total":"300.00"}]
}

Importación JSON

POST /import-json (JWT)

{
  "ventas":[{"fecha":"2026-01-15","categoria":"servicios","monto":1500.50}],
  "gastos":[{"fecha":"2026-01-16","categoria":"insumos","monto":300.00}]
}

🧪 Pruebas rápidas (curl)

Obtener primero el TOKEN desde backend-auth-drizzle.

# Crear venta
curl -X POST http://localhost:3001/ventas \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"fecha":"2026-01-15","categoria":"servicios","monto":1500.50,"descripcion":"venta X"}'

# Listar por mes actual
curl -s "http://localhost:3001/ventas?periodo=mes" \
  -H "Authorization: Bearer <TOKEN>"

# Dashboard diario
curl -s "http://localhost:3001/dashboard/line-chart?unit=day" \
  -H "Authorization: Bearer <TOKEN>"

🧱 Migraciones y modelos

Migraciones crean tablas ventas y gastos con deletedAt (soft delete).

Modelos Venta y Gasto usan paranoid: true.

Campos: fecha (DATEONLY), categoria (STRING), monto (DECIMAL(12,2)), descripcion (TEXT), userId (INTEGER).

🔒 Seguridad

Todos los endpoints (excepto /health) exigen Authorization: Bearer <JWT>.

Este servicio no llama al microservicio de Auth: solo verifica el token con JWT_SECRET.

📦 Postman

Importar postman/finanzas.postman_collection.json.
Variables sugeridas:

{{baseUrlFinanzas}} = http://localhost:3001

{{jwt}} = token de Auth

🛠 Troubleshooting

401 Invalid token → JWT_SECRET distinto al de Auth.

Migración fallida → revisar DATABASE_URL y correr npm run db:migrate.
