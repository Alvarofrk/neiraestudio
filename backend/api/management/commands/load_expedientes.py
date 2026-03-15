"""
Carga masiva de expedientes. Código interno se genera automáticamente (ENT-XXXX-YYYY-JLCA).
Ejecutar: python manage.py load_expedientes
"""
import re
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from api.models import LawCase, User


# Datos: Carátula, Nro. Expediente, Juzgado, Fuero, Estado, Cliente, DNI/RUC, Contraparte
EXPEDIENTES_DATA = [
    ("Basisilia Colque / Trata de Personas", "03514-2019-25-2111-JR-PE-02", "Sala Penal - Apelación", "Penal", "Abierto", "Basilia Colque Coaquira", "45301499", "Estado Perunao"),
    ("LUZ DELIA HUAHUALUQUE/ALIMENTOS", "115-2025-0-2106-JP-FC-01", "JUZGADO DE PAZ LETRADO DE HUANCANÉ", "Familia", "Abierto", "LUZ DELIA HUAHUALUQUE YAMPARA", "70131519", "YOEL FLORES CONDORI"),
    ("LUCERO DE LA FLOR HUANCOLLO/ALIMENTOS", "1738-2025-0-2111-JP-FC-02", "SEGUNDO JUZGADO DE PAZ LETRADO DE JULIACA", "Familia", "Abierto", "LUCERO DE LA FLOR HUANCOLLO COPACONDORI", "", "JULIO CESAR HUANCOLLO ROJAS"),
    ("HEREDEROS DE FELIX QUISPE/SUCESIÓN INTESTADA", "1079-2023-0-2111-JP-CI-03", "TERCER JUZGADO DE PAZ LETRADO DE JULIACA", "Civil", "Abierto", "HEREDEROS LEGALES DE FELIZ QUISPE GUTIERREZ", "", "HEREDEROS LEGALES DE FELIZ QUISPE GUTIERREZ"),
    ("ALEXANDER TITO/FILIACIÓN EXTRAMATRIMONIAL", "5027-2024-0-0410-JP-FC-02", "PRIMER JUZGADO DE PAZ LETRADO DE MARIANO MELGAR", "Familia", "Abierto", "ALEXANDER TITO ROMERO", "43535902", "KRAY DRITTE ROSSMERY TITO HILASACA/ RUSSBER LIZARDO TITO HILASACA/ ISRAEL ELISBAN TITO HILASACA"),
    ("ROXANA CCALLO/ALIMENTOS", "1198-2017-0-2111-JP-FC-02", "JUZGADO DE PAZ LETRADO DE CHUPA ITINERANTE A JULIACA", "Familia", "Abierto", "ROXANA CCALLO MAMANI", "43735768", "ANGEL DANTE QUISPE VILVA"),
    ("NELVA COPACONDORI/ALIMENTOS", "741-2002-0-2111-JP-FC-01", "PRIMER JUZGADO DE PAZ LETRADO DE JULIACA", "Familia", "Abierto", "NELVA COPACONDORI HUANCA", "02436623", "JULIO CESAR HUANCOLLO ROJAS"),
    ("NOHELY YUCRA/ALIMENTOS", "534-2023-0-2111-JP-FC-02", "SEGUNDO JUZGADO DE PAZ LETRADO DE JULIACA", "Familia", "Abierto", "NOHELY YUCRA TORRES", "72763935", "JESÚS ANGEL PAYE CHURATA"),
    ("VALERIANA MAMANI/ALIMENTOS", "2563-2014-0-2111-JP-FC-01", "JUZGADO DE PAZ LETRADO DE CHUPA ITINERANTE A JULIACA", "Familia", "Abierto", "VALERIANA MAMANI HUANCOLLO", "41263841", "HENRRY MENDOZA CARREÓN"),
    ("ELIZABETH CALCINA/ALIMENTOS", "2516-2021-0-2111-JP-FC-02", "SEGUNDO JUZGADO DE PAZ LETRADO DE LA CIUDAD DE JULIACA", "Familia", "Abierto", "ELIZABETH CALCINA MAMANI", "41670952", "DAVID PUMA CARTA"),
    ("LIBIA CARBAJAL/ALIMENTOS", "2679-2017-0-2111-JP-FC-01", "JUZGADO DE PAZ LETRADO DE SAN ANTON ITINERANTE A JULIACA", "Familia", "Abierto", "LIVIA CARBAJAL AMBROCIO", "02043076", "RONALD YANA QUISPE"),
    ("VICTORIA MULLISACA/ALIMENTOS", "594-2019-0-2111-JP-FC-03", "PRIMER JUZGADO DE PAZ LETRADO DE JULIACA", "Familia", "Abierto", "VICTORIA MULLISACA CHAMBI", "73498236", "DAVID FRANCISCO SUAÑA MAMANI"),
    ("VERÓNICA CÁCERES/ALIMENTOS", "3051-2018-0-2111-JP-FC-02", "JUZGADO DE PAZ LETRADO DE CHUPA ITINERANTE A JULIACA", "Familia", "Abierto", "VERÓNICA CÁCERES MEZA", "44967707", "JOVINAL CALSIN QUISPE"),
    ("FELIX QUISPE/PARTICIÓN Y DIVISIÓN DE BIEN INMUEBLE", "621-2021-0-2111-JR-CI-02", "SEGUNDO JUZGADO CIVIL DE  JULIACA", "Civil", "Abierto", "HEREDEROS LEGALES DE FELIX QUISPE GUTIERREZ", "", "FAUSTINA CUTIPA FERNANDEZ"),
    ("ELMER VELAZCO / DESOBEDIENCIA A LA AUTORIDAD", "02133-2026-24-0401-JR-PE-02", "3° JUZGADO PENAL UNIPERSONAL TRANSIT. FLAGRANCIA", "Penal", "Abierto", "ELMER ALEXANDER VELAZCO VERA", "72863716", "PNP"),
    ("Juan Loayza - Usurpación", "2706124501-2024-2657-0", "Primera Fiscalia Provincial Penal Corporativa de Julaca", "Penal", "Cerrado", "Juana Carlos Loayza Gómez", "45142577", "Brunilda Betariz Espezua Gallegos"),
    ("HUGO LARICO/ALIMENTOS", "1604-2019-0-0501-JP-FC-01", "JUZGADO SAM JUAN BAUTISTA", "Civil", "Abierto", "HUGO LARICO CASTILLÓN", "02544796", "ANNIE MELISA MENDOZA CONTRERAS"),
    ("RUTH MARISOL CHOQUE / REIVINDICACION", "00524-2008-0-2111-JM-CI-01", "SALA CIVIL - SEDE JULIACA", "Civil", "Abierto", "RUTH MARISOL CHOQUE RAMOS", "", "MIRANDA GONZALES, IRENE"),
    ("MARIA LUZ CUEVA / OBLIGACIÓN DE DAR SUMA DE DINERO", "01055-2025-0-2111-JP-CI-03", "3° JUZGADO DE PAZ LETRADO - SEDE JULIACA", "Civil", "Abierto", "MARIA LUZ CUEVA ROSSELL", "-----", "EDDY LEORADIA  TICONA MENDEZ"),
    ("CÉSAR APAZA CARCASI / OMISIÓN A.F", "2207-2025-0-2111-JR-PE-03", "3ER JUZGADO PENAL UNIPERSOL", "Penal", "Abierto", "CESAR ADBON APAZA CARCASI", "43067063", "———"),
    ("FORTUNATA MAMANI / LAVADO DE ACTIVOS", "270615500-2025-55", "4TO DESPACHO LAVADO - JULIACA", "Penal", "Abierto", "FORTUNATA MAMANI RAMOS", "02416156", "ESTADO PERUANO - F. BENITO VILCA"),
    ("Leslie Quispe / Alimentos", "1161-2022-0-2111-JP-FC-01", "J. Paz Letrado Juliaca / Primera", "Civil", "Abierto", "Leslie Vivian Quispe Canaza", "74698623", "Johon Quispe Canaza"),
]


class Command(BaseCommand):
    help = "Carga expedientes desde datos fijos. Código interno se genera automáticamente (ENT-XXXX-YYYY-JLCA)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            default="NeiraStudio2026",
            help="Usuario admin que figurará como creador de los expedientes.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Solo mostrar qué se crearía, sin guardar.",
        )

    def handle(self, *args, **options):
        username = options["username"]
        dry_run = options["dry_run"]

        try:
            admin_user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Usuario '{username}' no existe. Crea el superuser primero."))
            return

        year = timezone.now().year
        with transaction.atomic():
            last = LawCase.objects.order_by("-id").first()
            if last and last.codigo_interno:
                match = re.search(r"ENT-(\d+)-", last.codigo_interno)
                start_num = int(match.group(1)) + 1 if match else LawCase.objects.count() + 1
            else:
                start_num = LawCase.objects.count() + 1

            created = 0
            for i, row in enumerate(EXPEDIENTES_DATA):
                caratula, nro_expediente, juzgado, fuero, estado, cliente_nombre, cliente_dni, contraparte = row
                codigo = f"ENT-{str(start_num + i).zfill(4)}-{year}-JLCA"

                if dry_run:
                    self.stdout.write(f"  [dry-run] {codigo} | {caratula[:50]}... | {nro_expediente}")
                    created += 1
                    continue

                LawCase.objects.create(
                    codigo_interno=codigo,
                    caratula=caratula,
                    nro_expediente=nro_expediente,
                    juzgado=juzgado,
                    fuero=fuero,
                    estado=estado,
                    cliente=None,
                    cliente_nombre=cliente_nombre,
                    cliente_dni=cliente_dni.strip() if cliente_dni else "",
                    contraparte=contraparte,
                    fecha_inicio=timezone.now().date(),
                    created_by=admin_user,
                    last_modified_by=admin_user,
                )
                created += 1
                self.stdout.write(self.style.SUCCESS(f"  Creado: {codigo} - {caratula[:50]}..."))

        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry-run: se habrían creado {created} expedientes."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Listo. Creados {created} expedientes como '{username}'."))
