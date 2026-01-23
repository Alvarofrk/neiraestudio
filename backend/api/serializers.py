from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, LawCase, CaseActuacion, CaseAlerta, CaseNote


class UserSerializer(serializers.ModelSerializer):
    """Serializer para User"""
    class Meta:
        model = User
        fields = ['id', 'username', 'is_admin', 'is_staff']
        read_only_fields = ['id', 'is_staff']


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales incorrectas.')
            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo.')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Debe proporcionar username y password.')
        return attrs


class CaseActuacionSerializer(serializers.ModelSerializer):
    """Serializer para actuaciones"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = CaseActuacion
        fields = ['id', 'caso', 'fecha', 'descripcion', 'tipo', 'created_at', 'created_by', 'created_by_username']
        read_only_fields = ['id', 'created_at', 'created_by']


class CaseAlertaSerializer(serializers.ModelSerializer):
    """Serializer para alertas"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    completed_by_username = serializers.CharField(source='completed_by.username', read_only=True)
    
    class Meta:
        model = CaseAlerta
        fields = [
            'id', 'caso', 'titulo', 'resumen', 'hora', 'fecha_vencimiento', 
            'cumplida', 'prioridad', 'created_at', 'created_by', 'created_by_username',
            'completed_by', 'completed_by_username', 'completed_at'
        ]
        read_only_fields = ['id', 'created_at', 'created_by', 'completed_at', 'completed_by']


class CaseNoteSerializer(serializers.ModelSerializer):
    """Serializer para notas"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = CaseNote
        fields = ['id', 'caso', 'titulo', 'contenido', 'etiqueta', 'created_at', 'created_by', 'created_by_username']
        read_only_fields = ['id', 'created_at', 'created_by']


class LawCaseSerializer(serializers.ModelSerializer):
    """Serializer para expedientes con relaciones"""
    actuaciones = CaseActuacionSerializer(many=True, read_only=True)
    alertas = CaseAlertaSerializer(many=True, read_only=True)
    notas = CaseNoteSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    last_modified_by_username = serializers.CharField(source='last_modified_by.username', read_only=True)
    
    class Meta:
        model = LawCase
        fields = [
            'id', 'codigo_interno', 'caratula', 'nro_expediente', 'juzgado', 'fuero',
            'estado', 'abogado_responsable', 'cliente_nombre', 'cliente_dni', 'contraparte',
            'fecha_inicio', 'created_at', 'updated_at', 'created_by', 'last_modified_by',
            'created_by_username', 'last_modified_by_username',
            'actuaciones', 'alertas', 'notas'
        ]
        read_only_fields = ['id', 'codigo_interno', 'created_at', 'updated_at', 'created_by', 'last_modified_by']


class LawCaseListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de expedientes"""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    last_modified_by_username = serializers.CharField(source='last_modified_by.username', read_only=True)
    
    class Meta:
        model = LawCase
        fields = [
            'id', 'codigo_interno', 'caratula', 'nro_expediente', 'juzgado', 'fuero',
            'estado', 'cliente_nombre', 'abogado_responsable', 'fecha_inicio',
            'updated_at', 'created_by_username', 'last_modified_by_username'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios"""
    password = serializers.CharField(write_only=True, min_length=4, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'is_admin']
        extra_kwargs = {
            'username': {'required': True},
            'password': {'required': True, 'write_only': True},
        }
    
    def validate_username(self, value):
        """Validar que el username no exista"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Este nombre de usuario ya existe')
        return value
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            is_admin=validated_data.get('is_admin', False),
            is_staff=validated_data.get('is_admin', False),  # Si es admin, también es staff
        )
        return user
