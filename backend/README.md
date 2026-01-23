# Backend - Estudio Neira Trujillo

Backend Django REST Framework para el sistema de gestión jurídica del Estudio Neira Trujillo Abogados.

## 🚀 Características

- **Django 5.0** + **Django REST Framework**
- **Autenticación JWT** con Simple JWT
- **CORS configurado** para conexión con frontend React
- **Modelos completos** para expedientes, actuaciones, alertas y notas
- **API RESTful** con endpoints documentados
- **Auditoría completa** de cambios (created_by, last_modified_by)
- **Permisos basados en roles** (admin/usuario)

## 📋 Requisitos

- Python 3.10 o superior
- pip (gestor de paquetes de Python)

## 🔧 Instalación

1. **Crear entorno virtual** (recomendado):
```bash
python -m venv venv
```

2. **Activar entorno virtual**:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. **Instalar dependencias**:
```bash
pip install -r requirements.txt
```

4. **Aplicar migraciones**:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Crear usuario administrador inicial**:
```bash
python manage.py create_admin
```
Esto crea el usuario `admin` con contraseña `admin` (cambiar en producción).

6. **Crear superusuario para Django Admin** (opcional):
```bash
python manage.py createsuperuser
```

## 🏃 Ejecutar el servidor

```bash
python manage.py runserver
```

El servidor estará disponible en `http://localhost:8000`

## 📡 Endpoints de la API

### Autenticación
- `POST /api/auth/login/` - Iniciar sesión (retorna JWT tokens)
- `GET /api/auth/me/` - Obtener usuario actual
- `POST /api/auth/refresh/` - Refrescar token de acceso

### Dashboard
- `GET /api/dashboard/` - Estadísticas y datos del dashboard

### Expedientes (Cases)
- `GET /api/cases/` - Listar expedientes (con filtros: `?search=`, `?estado=`)
- `POST /api/cases/` - Crear nuevo expediente
- `GET /api/cases/{id}/` - Detalle de expediente
- `PUT /api/cases/{id}/` - Actualizar expediente completo
- `PATCH /api/cases/{id}/` - Actualizar expediente parcial
- `DELETE /api/cases/{id}/` - Eliminar expediente
- `POST /api/cases/{id}/add_actuacion/` - Agregar actuación
- `POST /api/cases/{id}/add_alerta/` - Agregar alerta
- `POST /api/cases/{id}/add_note/` - Agregar nota

### Actuaciones
- `GET /api/actuaciones/` - Listar actuaciones (`?caso={id}` para filtrar)
- `POST /api/actuaciones/` - Crear actuación
- `GET /api/actuaciones/{id}/` - Detalle de actuación
- `PUT /api/actuaciones/{id}/` - Actualizar actuación
- `DELETE /api/actuaciones/{id}/` - Eliminar actuación

### Alertas
- `GET /api/alertas/` - Listar alertas (`?caso={id}`, `?cumplida=true/false`)
- `POST /api/alertas/` - Crear alerta
- `GET /api/alertas/{id}/` - Detalle de alerta
- `PUT /api/alertas/{id}/` - Actualizar alerta
- `PATCH /api/alertas/{id}/toggle_cumplida/` - Toggle estado cumplida
- `DELETE /api/alertas/{id}/` - Eliminar alerta

### Notas
- `GET /api/notas/` - Listar notas (`?caso={id}` para filtrar)
- `POST /api/notas/` - Crear nota
- `GET /api/notas/{id}/` - Detalle de nota
- `PUT /api/notas/{id}/` - Actualizar nota
- `DELETE /api/notas/{id}/` - Eliminar nota

### Usuarios (solo admin)
- `GET /api/users/` - Listar usuarios
- `POST /api/users/` - Crear usuario
- `GET /api/users/{id}/` - Detalle de usuario
- `PUT /api/users/{id}/` - Actualizar usuario
- `DELETE /api/users/{id}/` - Eliminar usuario

## 🔐 Autenticación

Todas las peticiones (excepto login) requieren autenticación JWT. Incluir el token en el header:

```
Authorization: Bearer {access_token}
```

Ejemplo de login:
```json
POST /api/auth/login/
{
  "username": "admin",
  "password": "admin"
}

Response:
{
  "refresh": "...",
  "access": "...",
  "user": {
    "id": 1,
    "username": "admin",
    "is_admin": true
  }
}
```

## 📊 Modelos de Datos

### LawCase (Expediente)
- Código interno generado automáticamente: `ENT-XXXX-YYYY-JLCA`
- Estados: Abierto, En Trámite, Pausado, Cerrado
- Auditoría: created_by, last_modified_by, timestamps

### CaseActuacion
- Relacionado con LawCase
- Tipo: Escrito, Audiencia, Notificación, etc.
- Auditoría: created_by

### CaseAlerta
- Relacionado con LawCase
- Prioridades: Alta, Media, Baja
- Estado cumplida con tracking de quién completó

### CaseNote
- Relacionado con LawCase
- Etiquetas: Estrategia, Documentación, Investigación, Jurisprudencia
- Auditoría: created_by

## 🛠️ Desarrollo

### Estructura del proyecto
```
backend/
├── manage.py
├── requirements.txt
├── neiraestudio/          # Configuración del proyecto
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── api/                   # Aplicación principal
    ├── models.py
    ├── serializers.py
    ├── views.py
    ├── urls.py
    └── admin.py
```

### Comandos útiles

```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Acceder al shell de Django
python manage.py shell

# Ejecutar tests (cuando se implementen)
python manage.py test

# Recolectar archivos estáticos
python manage.py collectstatic
```

## 🔒 Seguridad

⚠️ **IMPORTANTE**: Antes de producción:
1. Cambiar `SECRET_KEY` en `settings.py`
2. Configurar `DEBUG = False`
3. Configurar `ALLOWED_HOSTS` apropiadamente
4. Usar base de datos PostgreSQL en lugar de SQLite
5. Configurar HTTPS
6. Cambiar credenciales por defecto del admin

## 📝 Notas

- El código interno de expedientes se genera automáticamente
- Los usuarios con `is_admin=True` tienen permisos de escritura en gestión de usuarios
- La auditoría se registra automáticamente en todas las operaciones
- CORS está configurado para permitir conexión desde `localhost:3000` y `localhost:5173`

## 🤝 Integración con Frontend

El frontend React debe:
1. Hacer login en `/api/auth/login/` y guardar el token
2. Incluir el token en todas las peticiones: `Authorization: Bearer {token}`
3. Usar los endpoints documentados arriba
4. Manejar refresh token cuando expire el access token
