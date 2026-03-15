# Índice en la tabla M2M para acelerar la subquery "solo mis casos" en listado de expedientes.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0016_caseactivitylog_and_more"),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS api_lawcase_abogados_user_id_idx ON api_lawcase_abogados_asignados (user_id);",
            reverse_sql="DROP INDEX IF EXISTS api_lawcase_abogados_user_id_idx;",
        ),
    ]
