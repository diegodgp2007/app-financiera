# App financiera personal

## Objetivo

Aplicación web para registrar y analizar los ingresos y gastos de una persona, entender cómo administra su dinero y generar informes financieros.

## Tecnología

- El proyecto se desarrollará con Angular.
- La interfaz debe adaptarse a computador y celular (diseño responsive).
- La primera versión será para una sola persona, pero la arquitectura debe permitir ampliar el sistema a varias personas o cuentas en el futuro.

## Alcance funcional inicial

- Registrar, consultar, editar y eliminar movimientos financieros.
- Registrar tanto ingresos como gastos.
- Usar COP (pesos colombianos) como moneda inicial.
- Incluir en cada movimiento: tipo (ingreso o gasto), valor, fecha, categoría, descripción opcional y medio de pago opcional (efectivo, tarjeta, transferencia u otro).
- Permitir filtrar movimientos por periodo y categoría.
- Permitir crear y administrar presupuestos por categoría y comparar el presupuesto con el gasto real.
- Mostrar resúmenes semanales y mensuales con ingresos, gastos, balance y desglose de gastos por categoría.
- Las semanas comienzan el lunes y terminan el domingo.
- Permitir descargar los informes como PDF.

## Criterios de producto

- Presentar los valores en formato COP de forma clara y consistente.
- Mantener una experiencia sencilla para registrar movimientos y revisar informes.
- Evitar acoplar los datos a una sola persona para que la expansión futura sea viable.
- Antes de implementar funcionalidades no definidas aquí, aclarar el alcance o proponer una decisión explícita.
