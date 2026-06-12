#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import date

# ── Paleta de colores Integra ──────────────────────────────────────────────
INTEGRA_NARANJA  = colors.HexColor("#E8471A")
INTEGRA_VERDE    = colors.HexColor("#4CAF50")
INTEGRA_GRIS     = colors.HexColor("#555555")
INTEGRA_GRIS_CLR = colors.HexColor("#F5F5F5")
INTEGRA_AZUL     = colors.HexColor("#1A3C6B")
NEGRO            = colors.HexColor("#1A1A1A")
BLANCO           = colors.white

PAGE_W, PAGE_H = A4
MARGIN = 2.0 * cm

# ── Estilos ────────────────────────────────────────────────────────────────
ss = getSampleStyleSheet()

def estilo(nombre, padre="Normal", **kw):
    s = ParagraphStyle(nombre, parent=ss[padre], **kw)
    return s

TITULO_PORTADA = estilo("TituloPortada",
    fontSize=26, leading=32, textColor=BLANCO, alignment=TA_CENTER,
    fontName="Helvetica-Bold")

SUBTITULO_PORTADA = estilo("SubtituloPortada",
    fontSize=14, leading=20, textColor=BLANCO, alignment=TA_CENTER,
    fontName="Helvetica")

SECCION = estilo("Seccion",
    fontSize=13, leading=18, textColor=BLANCO, fontName="Helvetica-Bold",
    spaceBefore=4, spaceAfter=4)

SUBSECCION = estilo("Subseccion",
    fontSize=11, leading=15, textColor=INTEGRA_AZUL, fontName="Helvetica-Bold",
    spaceBefore=10, spaceAfter=4)

CUERPO = estilo("Cuerpo",
    fontSize=9.5, leading=14, textColor=NEGRO, fontName="Helvetica",
    spaceBefore=2, spaceAfter=2, alignment=TA_JUSTIFY)

CUERPO_BOLD = estilo("CuerpoBold",
    fontSize=9.5, leading=14, textColor=NEGRO, fontName="Helvetica-Bold",
    spaceBefore=2, spaceAfter=2)

BULLET = estilo("Bullet",
    fontSize=9.5, leading=14, textColor=NEGRO, fontName="Helvetica",
    leftIndent=14, bulletIndent=4, spaceBefore=1, spaceAfter=1,
    alignment=TA_JUSTIFY)

CITA = estilo("Cita",
    fontSize=9.5, leading=14, textColor=INTEGRA_GRIS, fontName="Helvetica-Oblique",
    leftIndent=20, rightIndent=20, spaceBefore=6, spaceAfter=6,
    borderPad=6, alignment=TA_JUSTIFY)

NOTA_PIE = estilo("NotaPie",
    fontSize=7.5, leading=11, textColor=INTEGRA_GRIS, fontName="Helvetica",
    alignment=TA_CENTER)

ALERTA = estilo("Alerta",
    fontSize=9.5, leading=14, textColor=colors.HexColor("#7B0000"),
    fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=4)


# ── Helpers ────────────────────────────────────────────────────────────────
def header_band(texto, color=INTEGRA_NARANJA):
    """Tabla de una celda que actúa como cabecera de sección."""
    t = Table([[Paragraph(texto, SECCION)]], colWidths=[PAGE_W - 2*MARGIN])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    return t


def tabla_dos_col(filas, anchos=None, zebra=True):
    """Tabla genérica de dos columnas con cebrado opcional."""
    if anchos is None:
        anchos = [(PAGE_W - 2*MARGIN)*0.38, (PAGE_W - 2*MARGIN)*0.62]
    data = []
    for i, (k, v) in enumerate(filas):
        data.append([
            Paragraph(k, CUERPO_BOLD),
            Paragraph(v, CUERPO),
        ])
    estilos = [
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]
    if zebra:
        for i in range(0, len(data), 2):
            estilos.append(("BACKGROUND", (0,i), (-1,i), INTEGRA_GRIS_CLR))
    t = Table(data, colWidths=anchos)
    t.setStyle(TableStyle(estilos))
    return t


def tabla_indicadores(filas):
    """Tabla de indicadores con fondo azul en encabezados."""
    anchos = [(PAGE_W - 2*MARGIN)*0.50, (PAGE_W - 2*MARGIN)*0.50]
    data = []
    for k, v in filas:
        data.append([
            Paragraph(k, CUERPO_BOLD),
            Paragraph(v, estilo("Val", fontSize=9.5, leading=14,
                                textColor=INTEGRA_AZUL, fontName="Helvetica-Bold")),
        ])
    t = Table(data, colWidths=anchos)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), INTEGRA_GRIS_CLR),
        ("BACKGROUND",    (0,0), (0,-1), colors.HexColor("#E8F0FE")),
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#AAAAAA")),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t


def bloque_alerta(titulo, texto):
    """Bloque de alerta/advertencia."""
    data = [[
        Paragraph(f"⚠️  {titulo}", ALERTA),
        Paragraph(texto, CUERPO),
    ]]
    t = Table(data, colWidths=[(PAGE_W - 2*MARGIN)*0.28, (PAGE_W - 2*MARGIN)*0.72])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), colors.HexColor("#FFF3F3")),
        ("LINEAFTER",     (0,0), (0,-1), 2, colors.HexColor("#CC0000")),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t


def bloque_destacado(titulo, texto, color=colors.HexColor("#E8F4FD")):
    """Bloque de nota destacada."""
    data = [[
        Paragraph(titulo, CUERPO_BOLD),
        Paragraph(texto, CUERPO),
    ]]
    t = Table(data, colWidths=[(PAGE_W - 2*MARGIN)*0.30, (PAGE_W - 2*MARGIN)*0.70])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), color),
        ("LINEAFTER",     (0,0), (0,-1), 2, INTEGRA_AZUL),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t


def bullets(items):
    return [Paragraph(f"• {item}", BULLET) for item in items]


# ── Numerador de páginas ───────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    # Franja inferior
    canvas.setFillColor(INTEGRA_AZUL)
    canvas.rect(0, 0, PAGE_W, 1.1*cm, fill=1, stroke=0)
    canvas.setFillColor(BLANCO)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGIN, 0.4*cm, "Fundación Integra — Dirección Regional Biobío")
    canvas.drawRightString(PAGE_W - MARGIN, 0.4*cm,
                           f"Pág. {doc.page}  ·  Junio 2026  ·  Documento reservado de gestión")
    # Línea superior
    canvas.setFillColor(INTEGRA_NARANJA)
    canvas.rect(0, PAGE_H - 0.35*cm, PAGE_W, 0.35*cm, fill=1, stroke=0)
    canvas.restoreState()


# ── Portada ────────────────────────────────────────────────────────────────
def portada():
    story = []

    # Fondo azul portada
    ancho = PAGE_W - 2*MARGIN
    fondo = Table(
        [[Paragraph("FUNDACIÓN INTEGRA", TITULO_PORTADA),]],
        colWidths=[ancho]
    )
    fondo.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), INTEGRA_AZUL),
        ("TOPPADDING",    (0,0), (-1,-1), 30),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 20),
        ("RIGHTPADDING",  (0,0), (-1,-1), 20),
    ]))
    story.append(fondo)

    fondo2_data = [
        [Paragraph("Dirección Regional Biobío", SUBTITULO_PORTADA)],
        [Spacer(1, 0.3*cm)],
        [Paragraph("ROL, MARCO LEGAL Y CONTEXTO INSTITUCIONAL", estilo(
            "Sub2", fontSize=11, leading=15, textColor=INTEGRA_NARANJA,
            fontName="Helvetica-Bold", alignment=TA_CENTER))],
        [Spacer(1, 0.3*cm)],
        [Paragraph("Documento preparado para quien asume la Dirección Regional", estilo(
            "Sub3", fontSize=10, leading=14, textColor=colors.HexColor("#AACCFF"),
            fontName="Helvetica-Oblique", alignment=TA_CENTER))],
    ]
    fondo2 = Table(fondo2_data, colWidths=[ancho])
    fondo2.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), INTEGRA_AZUL),
        ("LEFTPADDING",   (0,0), (-1,-1), 20),
        ("RIGHTPADDING",  (0,0), (-1,-1), 20),
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 30),
    ]))
    story.append(fondo2)

    story.append(Spacer(1, 0.6*cm))

    # Ficha rápida en portada
    ficha = [
        ("Institución",    "Fundación Educacional para el Desarrollo Integral del Menor (Fundación Integra)"),
        ("Región de foco", "Biobío — capital Concepción"),
        ("Establecimientos Biobío", "63 salas cuna y jardines infantiles"),
        ("Niños/as atendidos Biobío", "Más de 4.300 (año parvulario 2025)"),
        ("Presencia comunal Biobío", "15 comunas"),
        ("Directora Ejecutiva Nacional", "María Paz Oyarzún Montalva (desde 10 abr. 2026)"),
        ("Presidenta Consejo Directivo", "Sergio Domínguez Rojas (desde mar. 2026)"),
        ("Elaboración",    "Investigación multi-fuente · Junio 2026"),
    ]
    story.append(tabla_dos_col(ficha, anchos=[
        (PAGE_W - 2*MARGIN)*0.36, (PAGE_W - 2*MARGIN)*0.64]))
    story.append(Spacer(1, 0.5*cm))
    story.append(HRFlowable(width="100%", thickness=2, color=INTEGRA_NARANJA))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph(
        "Este documento es una síntesis de gestión de uso interno. Los datos han sido verificados en al menos dos fuentes independientes. "
        "La información normativa se basa en los estatutos vigentes, la Ley 20.835 y los documentos de transparencia publicados por Fundación Integra.",
        NOTA_PIE))
    story.append(PageBreak())
    return story


# ── Sección 1: Identidad Institucional ─────────────────────────────────────
def seccion_identidad():
    s = []
    s.append(header_band("1.  IDENTIDAD INSTITUCIONAL"))
    s.append(Spacer(1, 0.3*cm))

    s.append(Paragraph("Misión", SUBSECCION))
    s.append(Paragraph(
        "<i>\"Favorecer el desarrollo pleno, bienestar integral y aprendizajes significativos "
        "de niñas y niños, a través de su protagonismo en espacios educativos amorosos, inclusivos, "
        "diversos y de calidad, promoviendo relaciones colaborativas entre los equipos de trabajo, "
        "las familias y la comunidad.\"</i>", CITA))

    s.append(Paragraph("Visión", SUBSECCION))
    s.append(Paragraph(
        "<i>\"Ser una institución educativa referente, que ofrezca una educación parvularia de calidad, "
        "situando en el centro de la gestión institucional a las niñas y niños como sujetos de derechos "
        "y ciudadanos activos de la sociedad, para contribuir a un Chile más inclusivo, justo y democrático.\"</i>",
        CITA))

    s.append(Paragraph("Historia resumida", SUBSECCION))
    hitos = [
        ("1975", "Creación del Comité Coordinador de Ayuda a la Comunidad — dependiente del Ministerio de Educación."),
        ("1979", "Se constituye como persona jurídica de derecho privado: FUNACO (Fundación Nacional de Ayuda a la Comunidad)."),
        ("1990", "Constitución legal definitiva como Fundación Educacional para el Desarrollo Integral del Menor (razón social vigente)."),
        ("2015", "Ley 20.835 crea la Subsecretaría de Educación Parvularia — principal organismo rector del nivel y fuente de financiamiento."),
        ("2022", "Reforma de estatutos: gobierno corporativo pasa a un Consejo Directivo con presidente nominado por el Ministro de Educación."),
        ("2026", "Nueva conducción: Sergio Domínguez (Presidente Consejo) y María Paz Oyarzún (Directora Ejecutiva) asumen en abril."),
    ]
    s.append(tabla_dos_col(hitos))

    s.append(Spacer(1, 0.4*cm))
    s.append(Paragraph("Escala nacional (2024)", SUBSECCION))
    indicadores = [
        ("Establecimientos",             "1.237 (salas cuna + jardines + modalidades no convencionales)"),
        ("Niños/as atendidos",           "83.436"),
        ("Trabajadoras/es",              "27.286"),
        ("Presencia comunal",            "320 de 346 comunas — 92,5% del país"),
        ("Satisfacción de familias",     "> 80% a nivel nacional (2023–2024)"),
        ("Direcciones Regionales",       "16 (la RM se divide en Norponiente y Suroriente)"),
    ]
    s.append(tabla_indicadores(indicadores))
    s.append(PageBreak())
    return s


# ── Sección 2: Marco Legal ─────────────────────────────────────────────────
def seccion_marco_legal():
    s = []
    s.append(header_band("2.  MARCO LEGAL Y NORMATIVO"))
    s.append(Spacer(1, 0.3*cm))

    s.append(Paragraph("Naturaleza jurídica", SUBSECCION))
    s.append(Paragraph(
        "Fundación Integra es una <b>persona jurídica de derecho privado sin fines de lucro</b>, "
        "regida por el Título XXXIII del Código Civil. No es un servicio público ni un organismo estatal, "
        "pero opera bajo fiscalización pública al recibir casi la totalidad de sus recursos del presupuesto nacional.",
        CUERPO))
    s.append(Spacer(1, 0.2*cm))
    s.append(bloque_destacado(
        "Clave práctica",
        "Al no ser servicio público, el personal se rige por el <b>Código del Trabajo</b> — no por el Estatuto Administrativo. "
        "Pero la CGR puede y debe fiscalizar por el uso de fondos públicos.",
        color=colors.HexColor("#EAF4EA")))

    s.append(Paragraph("Normativa aplicable", SUBSECCION))
    normas = [
        ("Código Civil — Tít. XXXIII",
         "Base legal de las fundaciones en Chile. Define su constitución, gobierno, patrimonio y disolución."),
        ("Estatutos Fundación Integra",
         "Definen misión, gobierno corporativo (Consejo Directivo), rol del Director/a Ejecutivo/a y estructura de la organización."),
        ("Ley 20.832 (2015)",
         "Crea la Autorización de Funcionamiento de Establecimientos de Educación Parvularia. Certificación obligatoria del Ministerio de Educación para todo establecimiento que funcione como sala cuna o jardín infantil. Sin ella, el establecimiento no puede operar legalmente."),
        ("Ley 20.835 (2015)",
         "Crea la Subsecretaría de Educación Parvularia como organismo rector del nivel. Define las relaciones de coordinación entre la Subsecretaría, JUNJI e Integra."),
        ("Ley de Presupuestos (anual)",
         "Fija las transferencias anuales a Integra (~99,3% de sus ingresos). Define montos, condiciones y rendición de cuentas de los recursos fiscales."),
        ("Bases Curriculares Educación Parvularia (BCEP 2018)",
         "Marco curricular obligatorio para todos los establecimientos parvularios del país. Aprobado por el Consejo Nacional de Educación. Integra adaptó el Referente Curricular 2025 en base a las BCEP."),
        ("Código del Trabajo",
         "Rige todas las relaciones laborales de Integra. Aplica a contratos, jornadas, negociación colectiva, despidos y beneficios de los 27.286 trabajadores/as."),
        ("Ley de Transparencia (Ley 20.285)",
         "Sujeta a Integra a publicar información de transparencia activa (remuneraciones, contratos, dotación, gastos) y a responder solicitudes de información pública ante el CPLT."),
        ("Ley N° 20.553 sobre JUNAEB (alim.)",
         "Regula el Programa de Alimentación Escolar que provee raciones a los niños/as de Integra — coordinación con JUNAEB obligatoria."),
    ]
    s.append(tabla_dos_col(normas, anchos=[
        (PAGE_W - 2*MARGIN)*0.30, (PAGE_W - 2*MARGIN)*0.70]))

    s.append(Spacer(1, 0.4*cm))
    s.append(Paragraph("Fiscalización y rendición de cuentas", SUBSECCION))
    s.append(Paragraph(
        "La <b>Contraloría General de la República (CGR)</b> tiene competencia plena sobre Fundación Integra "
        "por el carácter público de sus fondos. La CGR audita procesos financieros, contratos, rendiciones, "
        "nombramientos y cumplimiento de normativa. Sus dictámenes son vinculantes.",
        CUERPO))
    s.append(Spacer(1, 0.25*cm))
    s.append(bloque_alerta(
        "Contexto crítico 2026",
        "La CGR detectó (informe 2025-2026) préstamos bancarios por $110 mil millones para sostener "
        "operaciones ante demoras de 104 días en transferencias de la Subsecretaría; intereses de $2.785 millones "
        "en 2023-2024 (+628% vs. 2021); y rendiciones de $84.569 millones aprobadas sin revisión documental "
        "completa. El caso fue derivado al Consejo de Defensa del Estado. "
        "Este contexto hace que la gestión financiera regional esté bajo escrutinio máximo."))
    s.append(PageBreak())
    return s


# ── Sección 3: Estructura Organizacional ──────────────────────────────────
def seccion_estructura():
    s = []
    s.append(header_band("3.  ESTRUCTURA ORGANIZACIONAL"))
    s.append(Spacer(1, 0.3*cm))

    s.append(Paragraph("Gobierno nacional", SUBSECCION))
    org = [
        ("Consejo Directivo Nacional",
         "Máximo órgano de gobierno. Su presidente es nominado por el Ministro de Educación. "
         "Debe tener trayectoria en educación parvularia, formación idónea y experiencia en liderazgo educativo (requisito estatutario). "
         "Actual presidente: Sergio Domínguez Rojas (desde marzo 2026)."),
        ("Directora Ejecutiva Nacional",
         "Lidera la gestión institucional nacional. Designada por el Consejo Directivo con respaldo del Ministro de Educación. "
         "Actual directora: María Paz Oyarzún Montalva (desde 10 abr. 2026). "
         "Es cientista política PUC con magíster en Participación Ciudadana y fue subdirectora de Integra 2011–2014."),
        ("Direcciones Nacionales",
         "Educación y Calidad · Personas y Cultura · Finanzas y Administración · "
         "Comunicaciones y Asuntos Institucionales · Planificación y Desarrollo."),
        ("16 Direcciones Regionales",
         "Una por región (RM dividida en Norponiente y Suroriente). Sedes en las capitales regionales. "
         "Reportan directamente a la Dirección Ejecutiva Nacional."),
    ]
    s.append(tabla_dos_col(org, anchos=[
        (PAGE_W - 2*MARGIN)*0.30, (PAGE_W - 2*MARGIN)*0.70]))

    s.append(Spacer(1, 0.4*cm))
    s.append(Paragraph("Estructura de la Dirección Regional Biobío", SUBSECCION))

    org_reg = [
        ("Director/a Regional",
         "Cargo de confianza nombrado por la Dirección Ejecutiva Nacional. "
         "Es el representante institucional de Integra en la región. Lidera todos los departamentos y establecimientos regionales. "
         "Directora regional Biobío (hasta 2026): Karina Villarroel Ambiado."),
        ("Depto. Calidad Educativa",
         "Coordinadores/as pedagógicos/as zonales. Acompañan, supervisan y fortalecen la práctica docente en los establecimientos."),
        ("Depto. Cobertura y Proyectos",
         "Gestión de matrículas, apertura/cierre de establecimientos, proyectos de infraestructura, focalización territorial."),
        ("Depto. Personas",
         "Contrataciones, formación continua, bienestar laboral, relaciones sindicales, cumplimiento Código del Trabajo."),
        ("Depto. Administración y Finanzas",
         "Presupuesto regional, rendición de fondos, contratos de suministro, adquisiciones, activos."),
        ("Encargado/a Comunicaciones e Institucional",
         "Vocería regional, relaciones con medios, asuntos institucionales, relación con autoridades del territorio."),
        ("Directoras de establecimientos",
         "Lideran cada jardín/sala cuna. Reportan al Depto. de Calidad Educativa y al Director/a Regional en asuntos institucionales."),
    ]
    s.append(tabla_dos_col(org_reg, anchos=[
        (PAGE_W - 2*MARGIN)*0.28, (PAGE_W - 2*MARGIN)*0.72]))
    s.append(PageBreak())
    return s


# ── Sección 4: Rol del Director Regional ──────────────────────────────────
def seccion_rol():
    s = []
    s.append(header_band("4.  ROL Y FUNCIONES DEL/A DIRECTOR/A REGIONAL"))
    s.append(Spacer(1, 0.3*cm))

    s.append(Paragraph("Definición del cargo", SUBSECCION))
    s.append(Paragraph(
        "El/la Director/a Regional es el/la <b>representante institucional de Fundación Integra en la región</b>. "
        "Es un cargo de confianza de la Dirección Ejecutiva Nacional, sin concurso público obligatorio por tratarse de "
        "una persona jurídica privada regida por el Código del Trabajo. Reporta directamente a la Dirección Ejecutiva Nacional.",
        CUERPO))
    s.append(Spacer(1, 0.2*cm))
    s.append(bloque_destacado(
        "Perfil declarado",
        "Integra exige proveniencia del área educativa (educadoras de párvulos o docentes), experiencia en liderazgo "
        "de proyectos educativos y compromiso con la gestión centrada en los niños/as. Los 16 directores/as "
        "nombrados en 2025-2026 provienen en su totalidad del mundo de la educación.",
        color=colors.HexColor("#FFF8E1")))

    s.append(Paragraph("Funciones principales", SUBSECCION))

    s.append(Paragraph("A) Liderazgo pedagógico y de calidad educativa", CUERPO_BOLD))
    s += bullets([
        "Liderar la implementación del Referente Curricular 2025 y las Bases Curriculares de Educación Parvularia (BCEP 2018) en todos los establecimientos regionales.",
        "Garantizar visitas de acompañamiento técnico-pedagógico a cada establecimiento, asegurando retroalimentación efectiva a las directoras y equipos.",
        "Velar por el bienestar integral de los niños/as: aprendizaje, nutrición, salud y protección son responsabilidad del sistema.",
        "Conducir procesos de mejora continua: diagnóstico pedagógico regional, planes de mejoramiento y seguimiento de indicadores de calidad.",
        "Promover la formación continua de educadoras/es y técnicas/os del nivel parvulario en la región.",
    ])
    s.append(Spacer(1, 0.2*cm))

    s.append(Paragraph("B) Gestión institucional y administrativa", CUERPO_BOLD))
    s += bullets([
        "Planificar y ejecutar el presupuesto regional asignado por la Dirección Nacional; rendir cuentas íntegras y oportunas a la Dirección de Finanzas y a la Subsecretaría de Educación Parvularia.",
        "Asegurar el cumplimiento de la Ley 20.832 (Autorización de Funcionamiento) en todos los establecimientos — los que no cuenten con autorización vigente son prioridad inmediata.",
        "Gestionar el ciclo de matrículas: postulaciones, asignaciones, listas de espera y cobertura efectiva en las comunas del territorio.",
        "Supervisar la apertura y/o cierre de establecimientos, proyectos de infraestructura y remodelaciones con fondos regionales o del GORE.",
        "Garantizar el cumplimiento de los convenios con JUNAEB para la provisión de alimentación escolar.",
        "Administrar la dotación regional: contrataciones, desvinculaciones, permisos, licencias y adecuaciones por reforma de 40 horas semanales.",
    ])
    s.append(Spacer(1, 0.2*cm))

    s.append(Paragraph("C) Relaciones institucionales y vocería territorial", CUERPO_BOLD))
    s += bullets([
        "Representar a Fundación Integra ante autoridades regionales: Gobernador/a Regional, GORE, Seremi de Educación, Seremi de Salud, MEJOR NIÑEZ, municipios.",
        "Coordinar con la JUNJI regional acciones conjuntas de cobertura, calidad y comunicación a las familias.",
        "Participar en instancias del Gobierno Regional (comisiones, mesas intersectoriales) donde Integra tiene representación.",
        "Ser vocero/a institucional ante los medios de comunicación regionales en materias de educación parvularia.",
        "Gestionar alianzas con universidades, fundaciones y sector privado para proyectos de formación o infraestructura.",
    ])
    s.append(Spacer(1, 0.2*cm))

    s.append(Paragraph("D) Gestión de personas y clima organizacional", CUERPO_BOLD))
    s += bullets([
        "Liderar el equipo de la Dirección Regional y las directoras de establecimientos con foco en bienestar laboral y desarrollo profesional.",
        "Gestionar la negociación colectiva y las relaciones con el sindicato regional de trabajadores/as.",
        "Asegurar un ambiente laboral seguro, sin violencia ni acoso, cumpliendo la Ley Karin (21.643) de prevención del acoso laboral.",
        "Conducir evaluaciones de desempeño y planes de desarrollo para los equipos regionales.",
    ])
    s.append(Spacer(1, 0.2*cm))

    s.append(Paragraph("E) Transparencia y rendición de cuentas", CUERPO_BOLD))
    s += bullets([
        "Garantizar que todas las rendiciones de gastos regionales sean documentadas al 100%, sin uso de muestras (requisito CGR post-auditoría 2025-2026).",
        "Responder requerimientos de acceso a la información pública (Ley 20.285) derivados desde la Dirección Nacional.",
        "Reportar indicadores de gestión al Sistema de Información Nacional de Integra con periodicidad mensual.",
    ])

    s.append(Spacer(1, 0.4*cm))
    s.append(Paragraph("Atribuciones formales del cargo (según estatutos)", SUBSECCION))
    atrib = [
        ("Representación institucional",
         "Actuar en nombre de Fundación Integra ante organismos públicos y privados en el ámbito regional, en el marco de las facultades delegadas por la Dirección Ejecutiva Nacional."),
        ("Administración de recursos",
         "Autorizar gastos y compromisos presupuestarios dentro de los límites fijados por la Dirección de Finanzas Nacional."),
        ("Gestión de personal",
         "Contratar, supervisar y desvincular trabajadores/as del equipo regional conforme al Código del Trabajo y a los procedimientos internos de Integra."),
        ("Supervisión pedagógica",
         "Velar por la implementación del marco curricular y la política de calidad educativa en todos los establecimientos de su región."),
        ("Coordinación interinstitucional",
         "Establecer relaciones de coordinación y trabajo conjunto con organismos del Estado y la sociedad civil del territorio."),
        ("Gestión de crisis",
         "Activar protocolos institucionales ante emergencias, accidentes, situaciones de vulneración de derechos o crisis comunicacionales que involucren establecimientos de la región."),
    ]
    s.append(tabla_dos_col(atrib, anchos=[
        (PAGE_W - 2*MARGIN)*0.28, (PAGE_W - 2*MARGIN)*0.72]))
    s.append(PageBreak())
    return s


# ── Sección 5: Dirección Regional Biobío ──────────────────────────────────
def seccion_biobio():
    s = []
    s.append(header_band("5.  DIRECCIÓN REGIONAL BIOBÍO — DATOS DEL TERRITORIO", INTEGRA_VERDE))
    s.append(Spacer(1, 0.3*cm))

    datos = [
        ("Capital regional",              "Concepción"),
        ("Establecimientos Integra",      "63 salas cuna y jardines infantiles"),
        ("Niños/as atendidos",            "Más de 4.300 (año parvulario 2025)"),
        ("Presencia comunal",             "15 comunas de la región"),
        ("Directora regional (hasta 2026)", "Karina Villarroel Ambiado"),
        ("Ejemplos de comunas con presencia", "Concepción, Coronel, San Pedro de la Paz, Los Ángeles, Cañete, Isla Santa María, Huentelolén"),
        ("Inversión reciente",            "$501.000.000 en renovación del Jardín Infantil Candelaria (San Pedro de la Paz, 2025) — 68 niños/as beneficiados"),
        ("Desafíos territoriales",        "Conectividad digital en comunidades rurales (ej. Huentelolén, Isla Santa María); pertinencia cultural en comunidades mapuche"),
    ]
    s.append(tabla_dos_col(datos, anchos=[
        (PAGE_W - 2*MARGIN)*0.33, (PAGE_W - 2*MARGIN)*0.67]))

    s.append(Spacer(1, 0.35*cm))
    s.append(Paragraph("Actores estratégicos en el territorio", SUBSECCION))
    actores = [
        ("Gobernación Regional del Biobío",     "GORE — aliado para fondos de infraestructura, planes territoriales e inversión regional."),
        ("Seremi de Educación Biobío",           "Fiscalización, autorizaciones de funcionamiento, alineamiento pedagógico y política educativa regional."),
        ("Seremi de Salud Biobío",               "Protocolos de salud infantil, controles del niño sano, enfermedades respiratorias, higiene en establecimientos."),
        ("JUNJI Biobío",                         "Coordinación en cobertura, postulaciones, comunicaciones a familias y acciones conjuntas declaradas en Cuenta Pública 2025."),
        ("Mejor Niñez (ex-SENAME) Biobío",       "Convenios para modalidades no convencionales: casas de acogida, hogares y residencias de protección."),
        ("Municipios de la región",              "Convenios de terrenos, complementariedad con jardines municipales y articulación con programas sociales comunales."),
        ("JUNAEB Biobío",                        "Provisión de raciones alimentarias para los niños/as de todos los establecimientos de Integra en la región."),
        ("Universidades de Concepción/BioBío",   "Alianzas de formación continua, práctica de estudiantes de educación parvularia, investigación educativa."),
    ]
    s.append(tabla_dos_col(actores, anchos=[
        (PAGE_W - 2*MARGIN)*0.30, (PAGE_W - 2*MARGIN)*0.70]))

    s.append(Spacer(1, 0.35*cm))
    s.append(Paragraph("Modalidades de atención presentes en Biobío", SUBSECCION))
    modalidades = [
        ("Sala Cuna (0–2 años)",           "Modalidad convencional. Atención de jornada completa o parcial."),
        ("Jardín Infantil (2–4 años)",     "Modalidad convencional. Niveles Medio Menor y Mayor."),
        ("Modalidades no convencionales",  "Jardines en contextos rurales de difícil acceso (ej. Isla Santa María, Huentelolén). Casas de acogida vinculadas a Mejor Niñez."),
    ]
    s.append(tabla_dos_col(modalidades, anchos=[
        (PAGE_W - 2*MARGIN)*0.30, (PAGE_W - 2*MARGIN)*0.70]))
    s.append(PageBreak())
    return s


# ── Sección 6: Modelo Pedagógico ──────────────────────────────────────────
def seccion_pedagogia():
    s = []
    s.append(header_band("6.  MODELO PEDAGÓGICO Y REFERENTE CURRICULAR"))
    s.append(Spacer(1, 0.3*cm))

    marcos = [
        ("BCEP 2018 (obligatorio)",
         "Bases Curriculares de Educación Parvularia. Marco curricular del Estado para todo el nivel. "
         "Define núcleos de aprendizaje: Identidad y Autonomía; Convivencia y Ciudadanía; Corporalidad y Movimiento; "
         "Pensamiento Matemático; Lenguaje Verbal; Lenguajes Artísticos; Exploración del Entorno. "
         "Incorpora inclusión, interculturalidad, enfoque de género y desarrollo sostenible."),
        ("Referente Curricular Integra 2025 (propio)",
         "Publicado en septiembre 2025. Contextualiza e implementa las BCEP dentro de la identidad pedagógica de Integra. "
         "Centra la propuesta en una 'educación transformadora para el desarrollo humano y sostenible'. "
         "Es el documento pedagógico de referencia obligatoria para todas las educadoras de Integra."),
    ]
    s.append(tabla_dos_col(marcos, anchos=[
        (PAGE_W - 2*MARGIN)*0.28, (PAGE_W - 2*MARGIN)*0.72]))

    s.append(Paragraph("Principios pedagógicos de Integra", SUBSECCION))
    principios = [
        "El <b>juego</b> como derecho y principal principio pedagógico — eje de toda experiencia educativa.",
        "El niño/a como <b>sujeto de derechos y protagonista</b> activo de su aprendizaje — no receptor pasivo.",
        "<b>Vínculo afectivo</b> — educación en ambientes amorosos, seguros y contenedores.",
        "<b>Observación y reflexión</b> de la práctica pedagógica — profesionalización docente continua.",
        "<b>Trabajo con familias</b> — las familias son co-educadoras esenciales del proceso.",
        "<b>Bienestar integral</b> — aprendizaje, salud, nutrición y protección son inseparables.",
        "<b>Inclusión e interculturalidad</b> — respuesta activa a la diversidad cultural, funcional y lingüística.",
    ]
    s += bullets(principios)

    s.append(Spacer(1, 0.3*cm))
    s.append(Paragraph("Foco estratégico pedagógico 2025-2026", SUBSECCION))
    s.append(Paragraph(
        "La nueva conducción de Integra declaró la <b>calidad educativa</b> como foco central del período. "
        "Esto implica: (a) fortalecer el liderazgo pedagógico de las directoras de establecimiento; "
        "(b) mejorar la calidad de las interacciones adulto-niño al interior de las salas; "
        "(c) intensificar el acompañamiento técnico-pedagógico desde las Direcciones Regionales; "
        "(d) usar datos de evaluación del desarrollo infantil para informar las decisiones pedagógicas.",
        CUERPO))
    s.append(PageBreak())
    return s


# ── Sección 7: Financiamiento ──────────────────────────────────────────────
def seccion_financiamiento():
    s = []
    s.append(header_band("7.  FINANCIAMIENTO Y GESTIÓN PRESUPUESTARIA"))
    s.append(Spacer(1, 0.3*cm))

    s.append(Paragraph("Estructura de ingresos", SUBSECCION))
    ingresos = [
        ("Transferencias fiscales (Ley Presupuestos)", "~99,3% del total de ingresos (2022). La Subsecretaría de Educación Parvularia es la contraparte que transfiere los fondos."),
        ("Otras fuentes",                              "< 1%: donaciones, aportes privados puntuales."),
        ("Gratuidad para familias",                    "100%. Integra no cobra matrícula, mensualidad ni ningún arancel a las familias."),
    ]
    s.append(tabla_dos_col(ingresos))

    s.append(Spacer(1, 0.3*cm))
    s.append(Paragraph("Crisis financiera institucional (2025-2026)", SUBSECCION))
    s.append(bloque_alerta(
        "ALERTA CRÍTICA",
        "La Contraloría General de la República auditó a Fundación Integra y la Subsecretaría "
        "detectando graves irregularidades que debes conocer y aplicar en la gestión regional."))
    s.append(Spacer(1, 0.2*cm))

    crisis = [
        ("Préstamos bancarios",
         "$110 mil millones de pesos solicitados por Integra a instituciones bancarias para sostener operaciones ante demoras de hasta 104 días en la transferencia de fondos desde la Subsecretaría."),
        ("Costo financiero",
         "$2.785 millones en intereses y gastos financieros en 2023-2024 — incremento de 628% respecto a 2021."),
        ("Rendiciones irregulares",
         "$84.569 millones aprobados en rendiciones sin revisión documental completa (uso de 'muestras' en vez del 100% exigido por normativa)."),
        ("Recorte presupuestario",
         "El presupuesto fue reducido por segundo año consecutivo (2024 y 2025), agravando la brecha entre recursos disponibles y costos operativos."),
        ("Estado del caso",
         "El expediente fue derivado al Consejo de Defensa del Estado (CDE) para acciones de recupero. La nueva conducción enfrenta la tarea de sanear la situación."),
    ]
    s.append(tabla_dos_col(crisis, anchos=[
        (PAGE_W - 2*MARGIN)*0.25, (PAGE_W - 2*MARGIN)*0.75]))

    s.append(Spacer(1, 0.3*cm))
    s.append(Paragraph("Implicancias para la gestión regional", SUBSECCION))
    s += bullets([
        "<b>Rendición 100% documental</b>: todo gasto con fondos públicos debe estar respaldado con facturas, boletas o comprobantes originales. No se aceptan muestras.",
        "<b>Planificación presupuestaria anticipada</b>: proyectar necesidades de flujo de caja con al menos 90 días de anticipación para evitar comprometer servicios ante demoras de transferencias.",
        "<b>Cero compromisos sin disponibilidad presupuestaria</b>: no contratar ni comprometer pagos sin resolución de disponibilidad desde Finanzas Nacional.",
        "<b>Registro oportuno</b>: ingresar compromisos y gastos al sistema de gestión institucional en tiempo real.",
        "<b>Control de contratos de suministro</b>: revisar que proveedores estén en el Registro de Proveedores del Estado y que las licitaciones cumplan normativa de compras públicas (Ley 19.886).",
    ])
    s.append(PageBreak())
    return s


# ── Sección 8: Desafíos y Habilidades ─────────────────────────────────────
def seccion_desafios():
    s = []
    s.append(header_band("8.  DESAFÍOS ACTUALES Y HABILIDADES CLAVE"))
    s.append(Spacer(1, 0.3*cm))

    s.append(Paragraph("Desafíos del sector (2025-2026)", SUBSECCION))
    desafios = [
        ("Crisis financiera e institucional",
         "Reconstruir credibilidad pública y ordenar procesos financieros tras el escándalo auditado por la CGR. La nueva conducción nacional tiene esto como prioridad uno."),
        ("Baja de matrícula post-pandemia",
         "El sistema parvulario no ha recuperado los niveles de cobertura de 2019. Muchas familias no reincorporaron a sus hijos/as al sistema formal. Estrategias de captación son urgentes."),
        ("Recorte presupuestario",
         "Segundo año de reducción de fondos con inflación y mayores costos laborales. Eficiencia y priorización de gasto son imperativos."),
        ("Calidad pedagógica desigual",
         "Brecha entre establecimientos de alta y baja calidad. El foco estratégico 2025 es reducirla mediante liderazgo pedagógico y acompañamiento efectivo."),
        ("Proyecto de Ley de Modernización",
         "Primera iniciativa legislativa exclusiva para el nivel en años. Podría cambiar marcos de financiamiento, acreditación y estructura institucional."),
        ("Inclusión e interculturalidad",
         "Mayor presencia de niños/as migrantes y de comunidades mapuche en Biobío requiere adaptaciones pedagógicas, lingüísticas y culturales."),
        ("Conectividad rural",
         "Establecimientos en comunidades como Huentelolén e Isla Santa María requieren soluciones tecnológicas para acceder a formación y servicios institucionales."),
        ("Déficit de educadoras en regiones",
         "Escasez de educadoras de párvulos tituladas en comunas rurales; alta rotación en contextos de vulnerabilidad social."),
    ]
    s.append(tabla_dos_col(desafios, anchos=[
        (PAGE_W - 2*MARGIN)*0.27, (PAGE_W - 2*MARGIN)*0.73]))

    s.append(Spacer(1, 0.4*cm))
    s.append(Paragraph("Habilidades clave para el/la Director/a Regional", SUBSECCION))
    habilidades = [
        ("Liderazgo pedagógico",
         "Capacidad de conducir equipos técnicos hacia la mejora de la práctica docente. Conocimiento sólido de las BCEP y el Referente Curricular 2025."),
        ("Gestión financiera rigurosa",
         "Disciplina en rendición documental, control presupuestario y planificación de flujo de caja. Hoy es la competencia más crítica dadas las auditorías de la CGR."),
        ("Gestión de personas",
         "Liderazgo de equipos sindicalizados. Clima laboral. Negociación colectiva. Cumplimiento Ley Karin de prevención del acoso."),
        ("Relaciones institucionales",
         "Construcción de alianzas con GORE, municipios, Seremis, JUNJI y organismos del territorio para maximizar impacto en la infancia regional."),
        ("Comunicación y vocería",
         "Representación pública de Integra ante medios, autoridades y familias. Manejo de crisis comunicacionales."),
        ("Adaptabilidad territorial",
         "Sensibilidad a la diversidad geográfica, cultural, indígena y social de cada comunidad del Biobío."),
        ("Orientación a resultados",
         "Seguimiento de indicadores (cobertura, asistencia, calidad, satisfacción) con capacidad de tomar decisiones basadas en datos."),
        ("Ética y transparencia",
         "Gestión íntegra de recursos públicos, sin excepción. Cultura de rendición de cuentas en el equipo regional."),
    ]
    s.append(tabla_dos_col(habilidades, anchos=[
        (PAGE_W - 2*MARGIN)*0.28, (PAGE_W - 2*MARGIN)*0.72]))
    s.append(PageBreak())
    return s


# ── Sección 9: Plan de Entrada ─────────────────────────────────────────────
def seccion_plan_entrada():
    s = []
    s.append(header_band("9.  PLAN DE ENTRADA RECOMENDADO — PRIMEROS 90 DÍAS", INTEGRA_AZUL))
    s.append(Spacer(1, 0.3*cm))

    plan = [
        ("Semanas 1–2\nEscucha activa",
         "• Conoce a todo el equipo de la Dirección Regional: conversación 1:1 con cada jefatura.\n"
         "• Lee los últimos 3 informes de gestión regional y el presupuesto vigente.\n"
         "• Revisa el estado de Autorizaciones de Funcionamiento (Ley 20.832) de cada establecimiento.\n"
         "• Identifica las rendiciones pendientes y el estado de flujo de caja regional."),
        ("Semanas 3–5\nDiagnóstico",
         "• Visita al menos 10 establecimientos priorizando los más vulnerables y los de mayor matrícula.\n"
         "• Reúnete con el sindicato regional y escucha sus demandas y percepciones del clima laboral.\n"
         "• Mapea los actores estratégicos del territorio: primera reunión con Seremi de Educación y GORE.\n"
         "• Diagnóstico pedagógico: revisa los últimos informes de acompañamiento técnico de cada zona."),
        ("Semanas 6–8\nPriorización",
         "• Define junto al equipo regional las 3 prioridades del año con metas medibles.\n"
         "• Presenta a la Dirección Ejecutiva Nacional tu diagnóstico y plan de trabajo.\n"
         "• Sella la coordinación con JUNJI Biobío: acuerda protocolo de trabajo conjunto.\n"
         "• Asegura que las rendiciones críticas estén al día; activa apoyo de Finanzas Nacional si hay rezago."),
        ("Semanas 9–12\nEjecución",
         "• Lanza el plan de acompañamiento técnico-pedagógico anual a establecimientos.\n"
         "• Activa campaña regional de captación de matrícula si hay sub-cobertura en comunas.\n"
         "• Formaliza las relaciones con municipios y organismos del territorio.\n"
         "• Establece reuniones periódicas de equipo regional (al menos 2 veces al mes)."),
    ]

    anchos = [(PAGE_W - 2*MARGIN)*0.22, (PAGE_W - 2*MARGIN)*0.78]
    data = []
    for etapa, acciones in plan:
        data.append([
            Paragraph(etapa, CUERPO_BOLD),
            Paragraph(acciones.replace("\n", "<br/>"), CUERPO),
        ])
    t = Table(data, colWidths=anchos)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (0,-1), colors.HexColor("#E8F0FE")),
        ("BACKGROUND",    (0,1), (0,1), colors.HexColor("#FFF8E1")),
        ("BACKGROUND",    (0,2), (0,2), colors.HexColor("#E8F4EA")),
        ("BACKGROUND",    (0,3), (0,3), colors.HexColor("#FFF3E8")),
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]))
    s.append(t)

    s.append(Spacer(1, 0.4*cm))
    s.append(Paragraph("Preguntas que debes poder responder antes del día 30", SUBSECCION))
    preguntas = [
        "¿Cuántos establecimientos tienen su Autorización de Funcionamiento vigente, vencida o en trámite?",
        "¿Cuál es el saldo disponible del presupuesto regional y cuántas rendiciones están pendientes?",
        "¿Qué establecimientos tienen indicadores de asistencia bajo el 70%? ¿Por qué?",
        "¿Cuáles son los 3 jardines con mayor urgencia de acompañamiento pedagógico y cuál es la causa?",
        "¿Hay conflictos laborales activos o procesos de negociación colectiva en curso?",
        "¿Qué proyectos de infraestructura están activos o comprometidos en la región?",
        "¿Cuál es la relación vigente con el GORE y cuántos recursos regionales hay disponibles para Integra?",
    ]
    s += bullets(preguntas)
    s.append(PageBreak())
    return s


# ── Sección 10: Fuentes ────────────────────────────────────────────────────
def seccion_fuentes():
    s = []
    s.append(header_band("10.  FUENTES Y REFERENCIAS", INTEGRA_GRIS))
    s.append(Spacer(1, 0.3*cm))

    fuentes = [
        ("Fundación Integra — ¿Quiénes somos?",         "integra.cl/integra/"),
        ("Estructura Organizacional — Integra",          "integra.cl/estructura-organizacional/"),
        ("Wikipedia — Fundación Integra",                "es.wikipedia.org/wiki/Fundación_Integra"),
        ("Nueva Directora Ejecutiva — Integra (abr. 2026)", "integra.cl/nueva-directora-ejecutiva-maria-paz-oyarzun/"),
        ("Nuevos directores regionales — Integra",       "integra.cl/nuevos-directores-de-oficinas-regionales/"),
        ("Referente Curricular 2025 — Integra",          "integra.cl/un-referente-curricular-centrado-en-una-educacion-transformadora"),
        ("Calidad educativa como foco 2025 — Integra",   "integra.cl/calidad-educativa-como-foco-para-los-desafios-de-la-educacion-parvularia/"),
        ("Modalidades no convencionales — Integra",      "integra.cl/nuestros-jardines-infantiles/modalidades-no-convencionales/"),
        ("Nuevos jardines Biobío — Integra",             "integra.cl/cuatro-nuevos-jardines-infantiles-y-salas-cuna-en-biobio/"),
        ("Seremi Educación Biobío — año parvulario",     "biobio.mineduc.cl/2025/03/27/seremi-…-candelaria-san-pedro-de-la-paz/"),
        ("Cuenta Pública conjunta JUNJI-Integra 2025",   "parvularia.mineduc.cl/cuenta-publica-participativa-2025/"),
        ("Crisis financiera — BioBíoChile Investiga",    "biobiochile.cl/especial/bbcl-investiga/…/2026/03/04"),
        ("Contraloría detecta irregularidades — Atentos","atentos.cl/contraloria-detecta-prestamos-por-110-mil-millones"),
        ("Educación parvularia institucionalidad — CIPER","ciperchile.cl/2024/01/25/educacion-parvularia-institucionalidad"),
        ("Chileatiende — Fundación Integra",             "chileatiende.gob.cl/instituciones/ZB004"),
        ("Estatutos Fundación Integra",                  "f-integra.org/doc_integra/Estatutos_Fundacion_Integra.pdf"),
        ("Infogate — María Paz Oyarzún Directora Ejecutiva", "infogate.cl/2026/04/fundacion-integra-presenta-maria-paz-oyarzun"),
        ("El Rancagüino — Nuevas autoridades Integra 2026", "elrancaguino.cl/2026/04/15/fundacion-integra-presenta-nuevas-autoridades"),
    ]

    data = [[
        Paragraph("<b>N°</b>", CUERPO_BOLD),
        Paragraph("<b>Fuente</b>", CUERPO_BOLD),
        Paragraph("<b>URL / Referencia</b>", CUERPO_BOLD),
    ]]
    for i, (titulo, url) in enumerate(fuentes, 1):
        data.append([
            Paragraph(str(i), CUERPO),
            Paragraph(titulo, CUERPO),
            Paragraph(url, estilo("URL", fontSize=7.5, leading=11,
                                  textColor=INTEGRA_AZUL, fontName="Helvetica")),
        ])

    anchos = [(PAGE_W - 2*MARGIN)*0.05,
              (PAGE_W - 2*MARGIN)*0.42,
              (PAGE_W - 2*MARGIN)*0.53]
    t = Table(data, colWidths=anchos)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), INTEGRA_AZUL),
        ("TEXTCOLOR",     (0,0), (-1,0), BLANCO),
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [BLANCO, INTEGRA_GRIS_CLR]),
    ]))
    s.append(t)
    s.append(Spacer(1, 0.4*cm))
    s.append(HRFlowable(width="100%", thickness=1, color=INTEGRA_NARANJA))
    s.append(Spacer(1, 0.2*cm))
    s.append(Paragraph(
        "Documento elaborado mediante investigación multi-fuente con verificación adversarial de datos. "
        "Los datos cuantitativos clave fueron corroborados por al menos 2 fuentes independientes. "
        "Información válida a junio de 2026. Para actualizaciones consultar integra.cl y transparencia.integra.cl.",
        NOTA_PIE))
    return s


# ── Ensamblado ─────────────────────────────────────────────────────────────
def generar_pdf(ruta):
    doc = SimpleDocTemplate(
        ruta,
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=1.6*cm,
        bottomMargin=1.8*cm,
        title="Fundación Integra — Dirección Regional Biobío",
        author="Investigación multi-fuente / Claude Code · Junio 2026",
        subject="Rol, Marco Legal y Contexto Institucional",
    )

    story = []
    story += portada()
    story += seccion_identidad()
    story += seccion_marco_legal()
    story += seccion_estructura()
    story += seccion_rol()
    story += seccion_biobio()
    story += seccion_pedagogia()
    story += seccion_financiamiento()
    story += seccion_desafios()
    story += seccion_plan_entrada()
    story += seccion_fuentes()

    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generado: {ruta}")


if __name__ == "__main__":
    generar_pdf("/home/user/dotfiles/Integra_Biobio_DirectorRegional.pdf")
