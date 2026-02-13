# Especificación: Gestión de Usuarios (Admin)

> Documento de referencia para implementar la sección de gestión de usuarios.
> Completar y ajustar según avance el desarrollo.

---

## 1. Layout general

- **Estructura**: Similar a **Gestión de Turnos**
- **Sidebar lateral izquierdo**: filtros (mismo estilo, estructura y CSS que Gestión de Turnos)
- **Área principal derecha**: grid/cards de usuarios
- **Variables**: Usar `management-main`, `management-sidebar`, `filter-card`, etc. para consistencia

---

## 2. Filtro lateral (sidebar)

### 2.1 Criterios a considerar

- [ ] **Búsqueda**: por nombre, apellido, email
- [ ] **Rango de fecha de creación**: desde / hasta
- [ ] **Estado de verificación**: Todos / Verificado / No verificado
- [ ] **Perfil completo**: Todos / Completo / Incompleto
- [ ] **Rol**: Todos / Usuario / Administrador
- [ ] **Estado de cuenta**: Todos / Activo / Deshabilitado
- [ ] Botón **Limpiar filtros**

### 2.2 Estilos

- Reutilizar `.filter-card`, `.sidebar-header`, `.management-sidebar`, etc. de `admin-appointments-page.component.css`
- Misma paleta, bordes, espaciado que Gestión de Turnos

---

## 3. Card de usuario (vista resumida)

### 3.1 Información visible en la card

| Campo             | Tipo   | Notas                                    |
|-------------------|--------|------------------------------------------|
| Fecha de creación | texto  | Formato legible (ej. 12 Feb 2025)        |
| Nombre            | texto  | `firstName`                              |
| Apellido          | texto  | `lastName`                               |
| Email             | texto  | `user.email`                             |
| Verificado        | badge  | Sí / No (badge de estado)                |
| Perfil completo   | badge  | Sí / No (badge de estado)                |

### 3.2 Badges

- **Verificado**: badge verde si `emailVerified === true`, gris/amarillo si no
- **Perfil completo**: badge según `profileComplete` (o cálculo similar a sidebar)

### 3.3 Botones / acciones en la card

| Acción                     | Descripción                                           |
|----------------------------|-------------------------------------------------------|
| Reenviar email verificación| Dispara envío de email de verificación al usuario     |
| Reenviar cambio contraseña | Dispara envío de email para restablecer contraseña    |
| Ver más                    | Abre modal/drawer con información completa            |
| (opcional) Historial turnos| Link o botón para ver historial de turnos del usuario |

---

## 4. Vista "Ver más" (detalle completo)

### 4.1 Información adicional a mostrar

- Teléfono
- Dirección (calle, número, piso/depto, ciudad, código postal)
- Fecha de nacimiento
- Roles actuales
- Fecha de creación (completa)
- Último acceso (si el backend lo provee)

### 4.2 Acciones en la vista detalle

| Acción              | Descripción                                      |
|---------------------|--------------------------------------------------|
| Cambiar rol a Admin | Promover usuario a ROLE_ADMIN                    |
| Deshabilitar usuario| Desactiva la cuenta (no puede iniciar sesión)    |
| Reenviar verificación | Igual que en card                             |
| Reenviar cambio de contraseña | Igual que en card                       |

---

## 5. Historial de turnos del usuario

- **Endpoint**: `GET /api/admin/appointments?userId={id}` (ya existe)
- **Ubicación**: Opción/botón para acceder al historial de turnos de un usuario
- **Contenido esperado**:
  - Lista de turnos pasados y futuros
  - Fecha, hora, estado, servicio (si aplica)
  - Reutilizar lógica/componentes de Gestión de Turnos (AdminAppointmentService con `userId`)

---

## 6. Endpoints / API

### 6.1 Estado actual (verificado en backend)

| Acción                    | Método | Endpoint                          | ¿Existe? |
|---------------------------|--------|-----------------------------------|----------|
| Buscar usuarios (autocomplete) | GET | `/api/admin/users/search?query=...&limit=10` | ✅ Sí |
| Listar usuarios (paginado)| GET    | `/api/admin/users`                | ❌ No    |
| Obtener detalle usuario   | GET    | `/api/admin/users/{id}`           | ❌ No    |
| Reenviar verificación     | POST   | `/api/admin/users/{id}/resend-verify` | ❌ No |
| Reenviar cambio contraseña| POST   | `/api/admin/users/{id}/send-reset-password` | ❌ No |
| Cambiar rol               | PATCH  | `/api/admin/users/{id}/role`      | ❌ No    |
| Deshabilitar/Habilitar    | PATCH  | `/api/admin/users/{id}/enabled`   | ❌ No    |
| Historial turnos usuario  | GET    | `/api/admin/appointments?userId={id}` | ✅ Sí |

**Notas:**
- **Búsqueda**: `AdminUserSearchController` → `/api/admin/users/search` retorna id, email, firstName, lastName (para autocomplete).
- **Reenviar verificación (público)**: Existe `POST /auth/resend-verification?email=...` (usuario no logueado). Admin por userId: no implementado.
- **Reset contraseña (público)**: Existe `POST /auth/forgot-password` (body con email). Admin por userId: no implementado.
- **Historial de turnos**: Usar `GET /api/admin/appointments?userId={id}` (ya soporta filtro por userId).

### 6.2 Spring Security: columnas en User

| Campo             | Columna DB         | Uso en Spring Security                          |
|-------------------|--------------------|-------------------------------------------------|
| **enabled**       | `enabled`          | Deshabilitar cuenta (admin). Si `false`, no puede iniciar sesión. |
| **accountNonLocked** | `account_non_locked` | Bloqueo por intentos fallidos de login. Si `false`, cuenta bloqueada temporalmente. |

Para "deshabilitar usuario" en Gestión de Usuarios, usar **`enabled`** (no accountNonLocked).

---

## 7. Permisos

- Solo **ROLE_ADMIN**
- Ruta protegida con `adminGuard`
- Ruta: `/dashboard/admin/users`

---

## 8. Checklist de implementación

- [ ] Crear página vacía y ruta
- [ ] Añadir link en sidebar (sección Configuración)
- [ ] Layout: sidebar filtros + área de cards
- [ ] Filtros (búsqueda, fechas, verificado, perfil, rol, estado)
- [ ] Servicio/admin-user.service con llamadas a API
- [ ] Modelos: UserListResponse, UserDetailResponse
- [ ] Cards de usuario (vista resumida)
- [ ] Badges: verificado, perfil completo
- [ ] Botones: reenviar verificación, reenviar contraseña
- [ ] Modal/drawer "Ver más" con datos completos
- [ ] Acción: cambiar rol a Admin
- [ ] Acción: deshabilitar usuario
- [ ] Historial de turnos del usuario
- [ ] Paginación (si aplica)
- [ ] Estados de carga y error

---

## 9. Referencias

- **Layout y estilos**: `admin-appointments-page.component.html` y `.css`
- **Notificaciones**: `notifications-list-page` (también usa filtro lateral similar)
