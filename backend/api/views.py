from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.utils import timezone
from datetime import datetime, timedelta

from .models import User, LawCase, CaseActuacion, CaseAlerta, CaseNote
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    LawCaseSerializer, LawCaseListSerializer,
    CaseActuacionSerializer, CaseAlertaSerializer, CaseNoteSerializer
)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Permiso: solo admin puede acceder"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        # Para UserViewSet, solo admins pueden acceder (tanto leer como escribir)
        if view.__class__.__name__ == 'UserViewSet':
            return request.user.is_admin
        # Para otros viewsets, solo admin puede escribir
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.is_admin


class AuthView(APIView):
    """Vista para autenticación"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        """Login - retorna JWT tokens"""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CurrentUserView(APIView):
    """Obtener usuario actual"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de usuarios (solo admin)"""
    queryset = User.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_queryset(self):
        # Solo los admins pueden ver usuarios
        if not self.request.user.is_authenticated:
            return User.objects.none()
        
        if not self.request.user.is_admin:
            return User.objects.none()
        
        # No permitir eliminar el usuario admin principal
        return User.objects.exclude(id=1)
    
    def perform_create(self, serializer):
        """Crear usuario - solo admins pueden hacerlo"""
        if not self.request.user.is_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Solo los administradores pueden crear usuarios')
        serializer.save()


class LawCaseViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de expedientes"""
    queryset = LawCase.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LawCaseListSerializer
        return LawCaseSerializer
    
    def get_queryset(self):
        queryset = LawCase.objects.select_related('created_by', 'last_modified_by').prefetch_related(
            'actuaciones', 'alertas', 'notas'
        )
        
        # Filtros opcionales
        search = self.request.query_params.get('search', None)
        estado = self.request.query_params.get('estado', None)
        
        if search:
            queryset = queryset.filter(
                Q(caratula__icontains=search) |
                Q(cliente_nombre__icontains=search) |
                Q(nro_expediente__icontains=search) |
                Q(codigo_interno__icontains=search)
            )
        
        if estado:
            queryset = queryset.filter(estado=estado)
        
        return queryset
    
    def perform_create(self, serializer):
        """Generar código interno automáticamente"""
        year = timezone.now().year
        count = LawCase.objects.count() + 1
        codigo = f"ENT-{str(count).zfill(4)}-{year}-JLCA"
        
        serializer.save(
            codigo_interno=codigo,
            created_by=self.request.user,
            last_modified_by=self.request.user
        )
    
    def perform_update(self, serializer):
        serializer.save(last_modified_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_actuacion(self, request, pk=None):
        """Agregar actuación a un expediente"""
        caso = self.get_object()
        serializer = CaseActuacionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(caso=caso, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_alerta(self, request, pk=None):
        """Agregar alerta a un expediente"""
        caso = self.get_object()
        serializer = CaseAlertaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(caso=caso, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_note(self, request, pk=None):
        """Agregar nota a un expediente"""
        caso = self.get_object()
        serializer = CaseNoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(caso=caso, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CaseActuacionViewSet(viewsets.ModelViewSet):
    """ViewSet para actuaciones"""
    queryset = CaseActuacion.objects.select_related('caso', 'created_by')
    serializer_class = CaseActuacionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        caso_id = self.request.query_params.get('caso', None)
        if caso_id:
            queryset = queryset.filter(caso_id=caso_id)
        return queryset


class CaseAlertaViewSet(viewsets.ModelViewSet):
    """ViewSet para alertas"""
    queryset = CaseAlerta.objects.select_related('caso', 'created_by', 'completed_by')
    serializer_class = CaseAlertaSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def toggle_cumplida(self, request, pk=None):
        """Toggle estado cumplida de alerta"""
        alerta = self.get_object()
        alerta.cumplida = not alerta.cumplida
        if alerta.cumplida:
            alerta.completed_by = request.user
            alerta.completed_at = timezone.now()
        else:
            alerta.completed_by = None
            alerta.completed_at = None
        alerta.save()
        return Response(self.get_serializer(alerta).data)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        caso_id = self.request.query_params.get('caso', None)
        cumplida = self.request.query_params.get('cumplida', None)
        if caso_id:
            queryset = queryset.filter(caso_id=caso_id)
        if cumplida is not None:
            queryset = queryset.filter(cumplida=cumplida.lower() == 'true')
        return queryset


class CaseNoteViewSet(viewsets.ModelViewSet):
    """ViewSet para notas"""
    queryset = CaseNote.objects.select_related('caso', 'created_by')
    serializer_class = CaseNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def get_queryset(self):
        queryset = super().get_queryset()
        caso_id = self.request.query_params.get('caso', None)
        if caso_id:
            queryset = queryset.filter(caso_id=caso_id)
        return queryset


class DashboardView(APIView):
    """Vista para datos del dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Obtener estadísticas y alertas para dashboard"""
        cases = LawCase.objects.all()
        
        # Estadísticas básicas
        stats = {
            'total_cases': cases.count(),
            'open_cases': cases.filter(estado=LawCase.CaseStatus.OPEN).count(),
            'in_progress_cases': cases.filter(estado=LawCase.CaseStatus.IN_PROGRESS).count(),
            'paused_cases': cases.filter(estado=LawCase.CaseStatus.PAUSED).count(),
            'closed_cases': cases.filter(estado=LawCase.CaseStatus.CLOSED).count(),
        }
        
        # Obtener todas las alertas
        all_alertas = CaseAlerta.objects.select_related('caso', 'created_by', 'completed_by').all()
        
        # Últimos casos actualizados
        recent_cases = LawCase.objects.select_related('created_by', 'last_modified_by').order_by('-updated_at')[:5]
        
        return Response({
            'stats': stats,
            'recent_cases': LawCaseListSerializer(recent_cases, many=True).data,
            'alertas': CaseAlertaSerializer(all_alertas, many=True).data
        })
