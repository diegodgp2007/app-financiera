# Estado del proyecto

## Decisiones técnicas

- Frontend: Angular.
- Backend: Node.js con Express.
- Persistencia inicial: SQLite integrado en Node mediante `node:sqlite` (Node 22.13 o superior), sin servicio de base de datos externo.
- La base local se crea en `backend/data/finanzas.sqlite`; se puede cambiar con `DATABASE_PATH`.
- Montos en pesos se almacenan como enteros COP para evitar errores de precisión decimal.
- Los datos operativos pertenecen a una cuenta (`account_id`) para no atar el modelo a una sola persona.
- Los presupuestos son mensuales por categoría y cuenta.

## Estado actual

- Se inicializa el esquema SQLite para cuentas, categorías, movimientos y presupuestos.
- Se mantienen la ruta de salud del backend y el cliente HTTP inicial del frontend.
- Todavía no hay datos semilla, endpoints CRUD ni pantallas financieras conectadas.

## Siguiente paso

Definir o adoptar las categorías iniciales y construir la API de movimientos (crear, consultar, editar y eliminar), asociada a una cuenta.

## Alcance acordado

Registrar ingresos y gastos en COP, con fecha, categoría, descripción y medio de pago opcionales; filtrar por periodo y categoría; administrar presupuestos por categoría; consultar resúmenes semanales (lunes a domingo) y mensuales; exportar informes a PDF; interfaz adaptable a móvil y computador.
