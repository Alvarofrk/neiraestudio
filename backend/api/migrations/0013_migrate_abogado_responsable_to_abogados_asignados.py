# Data migration: abogado_responsable -> abogados_asignados

from django.db import migrations


def migrate_abogado_to_m2m(apps, schema_editor):
    """Migrar datos de abogado_responsable a abogados_asignados."""
    LawCase = apps.get_model('api', 'LawCase')
    User = apps.get_model('api', 'User')
    for caso in LawCase.objects.exclude(abogado_responsable=''):
        username = (caso.abogado_responsable or '').strip()
        if not username:
            continue
        try:
            user = User.objects.get(username=username)
            caso.abogados_asignados.add(user)
        except User.DoesNotExist:
            continue


def reverse_migrate(apps, schema_editor):
    """No revertir: abogados_asignados podría tener más de un usuario."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0012_add_abogados_asignados'),
    ]

    operations = [
        migrations.RunPython(migrate_abogado_to_m2m, reverse_migrate),
    ]
