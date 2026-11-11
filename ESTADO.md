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
- Se crea una cuenta personal inicial con categorías sugeridas: Alimentación, Transporte, Vivienda, Salud, Servicios y Otros para gastos; Salario, Negocio, Inversiones y Otros para ingresos.
- La API permite listar categorías y crear, consultar, editar, filtrar y eliminar movimientos.
- Angular ofrece una pantalla responsive para gestionar movimientos, con filtros por fechas y categoría y totales del periodo cargado.
- Los datos del backend están asociados a una cuenta inicial; la autenticación y gestión de múltiples cuentas quedan para una etapa posterior.

## Siguiente paso

Ejecutar frontend y backend y revisar el flujo de movimientos en pantalla; después avanzar a presupuestos y resúmenes semanales/mensuales.

## Alcance acordado

Registrar ingresos y gastos en COP, con fecha, categoría, descripción y medio de pago opcionales; filtrar por periodo y categoría; administrar presupuestos por categoría; consultar resúmenes semanales (lunes a domingo) y mensuales; exportar informes a PDF; interfaz adaptable a móvil y computador.
