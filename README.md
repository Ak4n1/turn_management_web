# TurnFlow - Frontend

Aplicacion web para gestion de turnos. Interfaz desarrollada en Angular 20 que consume la API REST del backend, permite a los usuarios solicitar y gestionar turnos, y a los administradores configurar calendarios, gestionar citas y enviar notificaciones. Actualizaciones en tiempo real mediante WebSocket.

## Tecnologias

- Angular 20 (standalone components)
- TypeScript 5.9
- RxJS 7.8
- Chart.js / ng2-charts
- Font Awesome 7
- Signals (Angular 16+)

## Arquitectura de paquetes

```
src/app/
|
+-- core/
|   +-- components/           # RootRedirectComponent (redireccion segun auth)
|   +-- guards/               # authGuard, guestGuard, emailVerifiedGuard, adminGuard
|   +-- interceptors/         # credentialsInterceptor, authRefreshInterceptor, rateLimitInterceptor
|   +-- models/               # websocket-message.model
|   +-- services/             # AuthService, AuthStateService, WebSocketService
|
+-- features/
|   +-- account/
|   |   +-- models/
|   |   +-- pages/            # AccountSettingsPageComponent
|   |   +-- services/         # NotificationPreferenceService
|   |
|   +-- admin/
|   |   +-- models/
|   |   +-- pages/            # UserManagementPageComponent, AuditPageComponent
|   |   +-- services/         # AdminUserManagementService
|   |
|   +-- appointments/
|   |   +-- user/
|   |   |   +-- components/   # SlotsModal, AppointmentDetailsModal, RescheduleModal, CancelModal
|   |   |   +-- pages/        # MyAppointmentsPageComponent
|   |   |   +-- services/     # AppointmentService
|   |   +-- admin/
|   |       +-- components/   # AppointmentDetailsModal, RescheduleModal, CancelModal
|   |       +-- models/
|   |       +-- pages/        # AdminAppointmentsPageComponent
|   |       +-- services/     # AdminAppointmentService
|   |
|   +-- auth/
|   |   +-- models/
|   |   +-- pages/            # LoginComponent, RegisterComponent, VerifyEmail, ForgotPassword, ResetPassword
|   |
|   +-- calendar/
|   |   +-- user/
|   |   |   +-- components/   # SlotsModal
|   |   |   +-- pages/        # CalendarPageComponent
|   |   |   +-- services/     # AvailabilityService
|   |   +-- admin/
|   |       +-- components/   # ConfigSavedModal, AffectedAppointmentsModal, DayDetailModal
|   |       +-- models/
|   |       +-- pages/        # ConsolidatedCalendarPage, WeeklyConfigPage, ExceptionsPage, BlocksPage
|   |       +-- services/     # AdminCalendarService, ExceptionService, BlockService
|   |
|   +-- dashboard/
|   |   +-- pages/            # UserDashboardPageComponent, AdminDashboardPageComponent
|   |   +-- utils/
|   |
|   +-- help/
|   |   +-- pages/            # HelpCenterPageComponent
|   |
|   +-- home/
|   |   +-- pages/            # DashboardHomeComponent
|   |
|   +-- notifications/
|   |   +-- constants/
|   |   +-- models/
|   |   +-- pages/            # NotificationsListPageComponent
|   |   +-- services/         # UserNotificationService, AdminManualNotificationService, NotificationSoundService
|   |   +-- utils/
|   |
|   +-- public/
|       +-- pages/            # HomeComponent, ServicesComponent, AboutComponent
|
+-- shared/
|   +-- atoms/                # Button, Label, Input, Textarea, DateInput, ErrorText, Spinner
|   +-- molecules/            # Modal, AlertModal, NavLink, PasswordInput, InputGroup, FormRow
|   +-- organisms/            # Sidebar, DashboardHeader, PublicNavbar, LoginForm, RegisterForm,
|   |                          # CalendarView (week-view, day-view, month-view, header, stats, legend)
|   +-- templates/            # DashboardLayout, DashboardLayoutWrapper, AuthLayout
|   +-- styles/               # colors.css, typography.css, spacing.css, shared.css
|
+-- app.routes.ts
+-- app.config.ts
+-- app.ts
```

## Features

### Account (Mi Cuenta)

Configuracion del perfil de usuario y preferencias de notificacion. Los usuarios pueden activar o desactivar tipos de notificacion (turnos, anuncios, recordatorios, etc.).

### Admin (Administracion)

Gestion de usuarios con filtros (busqueda, fecha, verificacion, perfil completo, rol, estado). Cards de usuario con acciones: cambiar rol, deshabilitar, reenviar verificacion, reenviar cambio de contraseña. Modal de detalle con informacion completa. Badge de usuarios en linea (WebSocket). Pagina de auditoria con historial de acciones.

### Appointments (Turnos)

Usuario: calendario de slots disponibles, solicitud de turno, listado de mis turnos, confirmar, cancelar o solicitar reprogramacion. Modales para detalles, cancelacion y reprogramacion. Admin: listado paginado de todos los turnos con filtros, cancelar, reprogramar, crear override. Cards con estado, fecha y usuario.

### Auth (Autenticacion)

Login, registro, verificacion de email, recuperacion y reset de contraseña. Layout dedicado (AuthLayout) para pantallas de autenticacion. Guards para rutas protegidas (auth, guest, emailVerified, admin).

### Calendar (Calendario)

Usuario: vista de calendario con slots disponibles por dia, seleccion de horario para pedir turno. Admin: calendario consolidado con vista semanal, diaria y mensual. Configuracion semanal (dias abiertos/cerrados), excepciones de calendario, bloqueos manuales. Modales de impacto y turnos afectados.

### Dashboard

Dashboard de usuario con actividad reciente, proximos turnos y enlaces rapidos. Dashboard de admin con metricas y accesos a gestion de turnos, calendario y usuarios. Graficos con Chart.js.

### Help (Centro de ayuda)

Pagina de ayuda con secciones frecuentes, guias y enlaces de soporte.

### Home

Pagina principal del dashboard (redireccion o bienvenida).

### Notifications (Notificaciones)

Listado de notificaciones con filtros (busqueda, tipo, rango de fechas, estado leidas/no leidas). Paginacion. Admins pueden enviar notificaciones manuales a todos los usuarios o a seleccionados. Sonido al recibir nueva notificacion. Actualizacion en tiempo real via WebSocket.

### Public

Paginas publicas: home, services, about. Navbar publica sin autenticacion.

## Patrones arquitectonicos

- **Feature-based structure**: Modulos por dominio de negocio (account, admin, appointments, auth, calendar, etc.). Cada feature agrupa pages, components, services y models propios.

- **Atomic Design**: Componentes compartidos organizados por complejidad. Atoms (Button, Label, Input), Molecules (Modal, FormRow, InputGroup), Organisms (Sidebar, CalendarView, LoginForm), Templates (DashboardLayout, AuthLayout).

- **Standalone components**: Todos los componentes son standalone, sin NgModules. Imports directos donde se necesitan.

- **Route guards**: Proteccion de rutas con guards funcionales (authGuard, guestGuard, emailVerifiedGuard, adminGuard). Redireccion segun estado de autenticacion y rol.

- **HTTP interceptors**: Interceptores para withCredentials, refresh token automatico y manejo de rate limit (429).

- **Services**: Servicios inyectables para comunicacion con la API (AuthService, AppointmentService, AdminCalendarService, etc.). Estado compartido en AuthStateService.

- **Signals**: Uso de signals para estado reactivo en componentes (computed, toSignal). Evita suscripciones manuales a Observables.

- **Smart / Presentational**: Paginas (smart) cargan datos y orquestan; componentes compartidos (presentational) reciben inputs y emiten outputs.

- **Design system**: Variables CSS centralizadas (colors, typography, spacing) en shared/styles. Consistencia visual en toda la app.
