# Plan de implementación – Neira Estudio

> **Propósito:** Seguimiento del plan por fases. Marca con `[x]` lo completado. Cuando todo esté listo, elimina este archivo.

---

## FASE 0: Pre-requisitos y verificación

- [ ] Revisar migraciones existentes y si hay datos en producción
- [ ] Confirmar qué usuarios tienen `abogado_responsable` asignado
- [ ] Listar ViewSets/endpoints que tocan LawCase, actuaciones, alertas, notas
- [ ] Documentar permisos actuales en cada endpoint

---

## FASE 1: Corrección IDOR (actuaciones, alertas, notas)

- [ ] Añadir función `user_has_access_to_case(user, case)` en `backend/api/views.py`
- [ ] Filtrar queryset en CaseActuacionViewSet por casos accesibles
- [ ] Validar acceso en create/update/destroy de CaseActuacionViewSet
- [ ] Filtrar queryset en CaseAlertaViewSet por casos accesibles
- [ ] Validar acceso en create/update/destroy de CaseAlertaViewSet
- [ ] Filtrar queryset en CaseNoteViewSet por casos accesibles
- [ ] Validar acceso en create/update/destroy de CaseNoteViewSet
- [ ] Revisar DashboardAlertasView, DashboardView, export_excel, export_timeline
- [ ] Pruebas manuales: admin ve todo, abogado solo sus casos

---

## FASE 2: Modelo multi-abogado (asignación 1 o más)

- [ ] Añadir `abogados_asignados` ManyToMany(User) en LawCase
- [ ] Crear migración de esquema
- [ ] Crear migración de datos (abogado_responsable → abogados_asignados)
- [ ] Actualizar LawCaseSerializer y LawCaseListSerializer
- [ ] Actualizar get_queryset en LawCaseViewSet para abogados
- [ ] Actualizar perform_create/perform_update
- [ ] Adaptar Dashboard, export_excel y stats por abogado

---

## FASE 3: Frontend multi-abogado

- [ ] Actualizar `types.ts` con abogados_asignados
- [ ] CaseForm: multiselect de abogados en lugar de select único
- [ ] CaseDetail: multiselect para editar abogados asignados
- [ ] CaseList: columna “Abogados asignados”
- [ ] Ajustar apiCreateCase y apiUpdateCase en apiService

---

## FASE 4: Permisos con abogados_asignados

- [ ] Actualizar `user_has_access_to_case` para usar abogados_asignados
- [ ] Ajustar filtros en CaseActuacionViewSet, CaseAlertaViewSet, CaseNoteViewSet

---

## FASE 5: Endpoint de eventos de calendario

- [ ] Crear CalendarEventsView: GET /api/calendar/events/?desde=&hasta=
- [ ] Formato respuesta: eventos de alertas + actuaciones de casos accesibles
- [ ] Filtrar por rango de fechas y permisos
- [ ] Registrar ruta en urls.py
- [ ] Añadir apiGetCalendarEvents en frontend

---

## FASE 6: Eventos personales (backend)

- [ ] Crear modelo UserCalendarEvent (user, titulo, fecha, hora, tipo, descripcion, caso opcional)
- [ ] Crear migración
- [ ] UserCalendarEventSerializer y UserCalendarEventViewSet
- [ ] Registrar ruta
- [ ] Incluir eventos personales en CalendarEventsView

---

## FASE 7: Calendario personal (frontend)

- [ ] Cambiar Calendario para cargar desde apiGetCalendarEvents
- [ ] Modal/panel para crear/editar evento personal
- [ ] apiCreateCalendarEvent, apiUpdateCalendarEvent, apiDeleteCalendarEvent
- [ ] Tipos CalendarEvent, UserCalendarEvent en types.ts

---

## FASE 8: Ajustes finales

- [ ] (Opcional) Deprecar abogado_responsable si se elimina
- [ ] Definir comportamiento de rol “usuario”
- [ ] Pruebas: admin, abogado, usuario
- [ ] Revisar índices y performance

---

*Eliminar este archivo cuando todo esté completado.*
