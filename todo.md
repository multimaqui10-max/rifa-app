# Plataforma de Rifa - TODO

## Base de Datos
- [x] Crear tabla de números (1000 números con estado: disponible, reservado, vendido)
- [x] Crear tabla de participantes (nombre, apellido, teléfono)
- [x] Crear tabla de transacciones (vinculación con números y participantes)
- [x] Crear tabla de configuración de rifa (premios, fecha de sorteo, valor del número)
- [x] Crear tabla de reservas temporales (números reservados con timestamp de expiración)

## Backend - API
- [x] Endpoint para obtener lista de números con estado
- [x] Endpoint para reservar número temporalmente
- [x] Endpoint para cancelar reserva
- [x] Endpoint para crear participante
- [ ] Endpoint para procesar pago con Stripe (pendiente integración)
- [x] Endpoint para obtener configuración de rifa
- [x] Endpoint para obtener historial de transacciones

## Integración Stripe
- [ ] Configurar claves de Stripe (pública y privada) - PENDIENTE
- [ ] Crear sesión de pago - PENDIENTE
- [ ] Procesar webhook de pago completado - PENDIENTE
- [ ] Procesar webhook de pago fallido - PENDIENTE
- [ ] Marcar números como vendidos después de pago exitoso - PENDIENTE

## Frontend Público
- [x] Diseño de página de inicio con información de la rifa
- [x] Grilla visual de 1000 números (responsiva)
- [x] Sistema de selección y reserva de números
- [x] Visualización de números vendidos/disponibles/reservados
- [x] Formulario de registro de participante
- [ ] Integración con flujo de pago de Stripe - PENDIENTE
- [x] Confirmación de compra exitosa
- [x] Visualización de premios y fecha del sorteo

## Panel de Administración
- [x] Autenticación de administrador
- [x] Dashboard principal con estadísticas
- [x] Gestión de premios (crear, editar, eliminar)
- [x] Configuración de fecha de sorteo
- [x] Configuración de valor del número
- [x] Visualización de participantes registrados
- [x] Visualización de transacciones completadas
- [ ] Exportación de datos (participantes, transacciones) - PENDIENTE
- [x] Gestión manual de números (marcar como vendido, liberar)

## Diseño y UX
- [ ] Diseño elegante y profesional
- [ ] Responsividad en desktop, tablet y móvil
- [ ] Paleta de colores profesional
- [ ] Tipografía clara y legible
- [ ] Animaciones suaves y micro-interacciones
- [ ] Estados visuales claros (hover, active, disabled)

## Pruebas y Optimización
- [x] Pruebas de funcionalidad de reserva
- [ ] Pruebas de flujo de pago - PENDIENTE (después de integrar Stripe)
- [ ] Pruebas responsivas en diferentes dispositivos
- [x] Validación de datos en frontend y backend
- [ ] Optimización de rendimiento - PENDIENTE
