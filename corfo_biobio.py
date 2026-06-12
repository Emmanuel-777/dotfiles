#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY

PAGE_W, PAGE_H = A4
MARGIN = 2.0 * cm

# ── Paleta CORFO ───────────────────────────────────────────────────────────
CORFO_AZUL    = colors.HexColor("#003A70")
CORFO_CELESTE = colors.HexColor("#0072BC")
CORFO_VERDE   = colors.HexColor("#009A44")
CORFO_NARANJA = colors.HexColor("#E8560A")
GRIS_CLARO    = colors.HexColor("#F4F6F9")
GRIS_MED      = colors.HexColor("#555555")
NEGRO         = colors.HexColor("#1A1A1A")
BLANCO        = colors.white

# ── Estilos ────────────────────────────────────────────────────────────────
ss = getSampleStyleSheet()

def E(name, padre="Normal", **kw):
    return ParagraphStyle(name, parent=ss[padre], **kw)

TPORTADA   = E("TP", fontSize=28, leading=34, textColor=BLANCO,
               fontName="Helvetica-Bold", alignment=TA_CENTER)
STPORTADA  = E("STP", fontSize=14, leading=20, textColor=BLANCO,
               fontName="Helvetica", alignment=TA_CENTER)
SECCION    = E("SEC", fontSize=13, leading=17, textColor=BLANCO,
               fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=4)
SUBSEC     = E("SSEC", fontSize=11, leading=15, textColor=CORFO_AZUL,
               fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=4)
CUERPO     = E("CUERPO", fontSize=9.5, leading=14, textColor=NEGRO,
               fontName="Helvetica", spaceBefore=2, spaceAfter=2,
               alignment=TA_JUSTIFY)
CBOLD      = E("CBOLD", fontSize=9.5, leading=14, textColor=NEGRO,
               fontName="Helvetica-Bold", spaceBefore=2, spaceAfter=2)
BULLET     = E("BLET", fontSize=9.5, leading=14, textColor=NEGRO,
               fontName="Helvetica", leftIndent=14, bulletIndent=4,
               spaceBefore=1, spaceAfter=1, alignment=TA_JUSTIFY)
CITA       = E("CITA", fontSize=9.5, leading=14,
               textColor=GRIS_MED, fontName="Helvetica-Oblique",
               leftIndent=20, rightIndent=20, spaceBefore=6, spaceAfter=6,
               alignment=TA_JUSTIFY)
NOTA_PIE   = E("NP", fontSize=7.5, leading=11, textColor=GRIS_MED,
               fontName="Helvetica", alignment=TA_CENTER)
ALERTA_T   = E("AT", fontSize=9.5, leading=14,
               textColor=colors.HexColor("#7B0000"),
               fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=4)
VERDE_T    = E("VT", fontSize=9.5, leading=14,
               textColor=colors.HexColor("#1A5C1A"),
               fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=4)

ANC = PAGE_W - 2 * MARGIN

# ── Helpers ────────────────────────────────────────────────────────────────
def band(texto, color=CORFO_AZUL):
    t = Table([[Paragraph(texto, SECCION)]], colWidths=[ANC])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), color),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 12),
        ("RIGHTPADDING",  (0,0), (-1,-1), 12),
    ]))
    return t

def tabla2(filas, w1=0.36):
    w = [ANC * w1, ANC * (1 - w1)]
    data = [[Paragraph(k, CBOLD), Paragraph(v, CUERPO)] for k, v in filas]
    t = Table(data, colWidths=w)
    t.setStyle(TableStyle([
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 7),
        ("RIGHTPADDING",  (0,0), (-1,-1), 7),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("ROWBACKGROUNDS",(0,0), (-1,-1), [BLANCO, GRIS_CLARO]),
    ]))
    return t

def tabla_ind(filas):
    w = [ANC * 0.55, ANC * 0.45]
    data = [[Paragraph(k, CBOLD),
             Paragraph(v, E("VI", fontSize=9.5, leading=14,
                            textColor=CORFO_CELESTE, fontName="Helvetica-Bold"))]
            for k, v in filas]
    t = Table(data, colWidths=w)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), GRIS_CLARO),
        ("BACKGROUND",    (0,0), (0,-1), colors.HexColor("#E5EFF8")),
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#AAAAAA")),
        ("TOPPADDING",    (0,0), (-1,-1), 6),
        ("BOTTOMPADDING", (0,0), (-1,-1), 6),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t

def alerta(titulo, texto):
    d = [[Paragraph(f"⚠️  {titulo}", ALERTA_T),
          Paragraph(texto, CUERPO)]]
    t = Table(d, colWidths=[ANC * 0.26, ANC * 0.74])
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

def destacado(titulo, texto, bg=colors.HexColor("#E5EFF8")):
    d = [[Paragraph(titulo, CBOLD), Paragraph(texto, CUERPO)]]
    t = Table(d, colWidths=[ANC * 0.28, ANC * 0.72])
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), bg),
        ("LINEAFTER",     (0,0), (0,-1), 2, CORFO_AZUL),
        ("TOPPADDING",    (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("LEFTPADDING",   (0,0), (-1,-1), 10),
        ("RIGHTPADDING",  (0,0), (-1,-1), 10),
        ("VALIGN",        (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t

def bullets(items):
    return [Paragraph(f"• {i}", BULLET) for i in items]

def sp(h=0.3):
    return Spacer(1, h * cm)

# ── Pie de página ──────────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(CORFO_AZUL)
    canvas.rect(0, 0, PAGE_W, 1.1 * cm, fill=1, stroke=0)
    canvas.setFillColor(BLANCO)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawString(MARGIN, 0.4 * cm,
                      "CORFO — Comité de Desarrollo Productivo Regional Biobío")
    canvas.drawRightString(PAGE_W - MARGIN, 0.4 * cm,
                           f"Pág. {doc.page}  ·  Junio 2026  ·  Documento de gestión directiva")
    canvas.setFillColor(CORFO_CELESTE)
    canvas.rect(0, PAGE_H - 0.35 * cm, PAGE_W, 0.35 * cm, fill=1, stroke=0)
    canvas.restoreState()


# ══════════════════════════════════════════════════════════════════════════════
#  SECCIONES
# ══════════════════════════════════════════════════════════════════════════════

def portada():
    s = []
    fondo1 = Table([[Paragraph("CORFO", TPORTADA)]], colWidths=[ANC])
    fondo1.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), CORFO_AZUL),
        ("TOPPADDING",    (0,0), (-1,-1), 28),
        ("BOTTOMPADDING", (0,0), (-1,-1), 4),
        ("LEFTPADDING",   (0,0), (-1,-1), 20),
        ("RIGHTPADDING",  (0,0), (-1,-1), 20),
    ]))
    s.append(fondo1)

    fondo2_data = [
        [Paragraph("Corporación de Fomento de la Producción", STPORTADA)],
        [sp(0.25)],
        [Paragraph("Comité de Desarrollo Productivo Regional — Biobío",
                   E("STP2", fontSize=13, leading=18, textColor=BLANCO,
                     fontName="Helvetica-Bold", alignment=TA_CENTER))],
        [sp(0.2)],
        [Paragraph("ROL, MARCO LEGAL Y CONTEXTO INSTITUCIONAL",
                   E("STP3", fontSize=11, leading=15,
                     textColor=colors.HexColor("#7EC8E3"),
                     fontName="Helvetica-Bold", alignment=TA_CENTER))],
        [sp(0.2)],
        [Paragraph("Documento preparado para quien asume la Dirección Ejecutiva Regional",
                   E("STP4", fontSize=10, leading=14,
                     textColor=colors.HexColor("#AACCFF"),
                     fontName="Helvetica-Oblique", alignment=TA_CENTER))],
    ]
    fondo2 = Table(fondo2_data, colWidths=[ANC])
    fondo2.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,-1), CORFO_AZUL),
        ("LEFTPADDING",   (0,0), (-1,-1), 20),
        ("RIGHTPADDING",  (0,0), (-1,-1), 20),
        ("TOPPADDING",    (0,0), (-1,-1), 0),
        ("BOTTOMPADDING", (0,0), (-1,-1), 28),
    ]))
    s.append(fondo2)
    s.append(sp(0.6))

    ficha = [
        ("Institución",              "Corporación de Fomento de la Producción (CORFO)"),
        ("Tipo de entidad",          "Empresa del Estado — Ministerio de Economía, Fomento y Turismo"),
        ("Entidad regional",         "Comité de Desarrollo Productivo Regional Biobío"),
        ("Sede Biobío",              "Rengo 476, piso 4, Concepción · (+41) 2907700"),
        ("Directora Ejecutiva Biobío","Roberta Lama Bedwell (desde junio 2022)"),
        ("VP Ejecutivo Nacional",    "José Miguel Benavente (hasta nov. 2025) — cargo en proceso de renovación"),
        ("Presupuesto Biobío 2026",  "M$4.574.173 (Ley) — M$5.751.173 (con apalancamiento regional)"),
        ("Resultados 2025",          "201 proyectos aprobados · +$6.400 millones ejecutados en Biobío"),
        ("Elaboración",              "Investigación multi-fuente · Junio 2026"),
    ]
    s.append(tabla2(ficha))
    s.append(sp(0.4))
    s.append(HRFlowable(width="100%", thickness=2, color=CORFO_CELESTE))
    s.append(sp(0.25))
    s.append(Paragraph(
        "Documento de uso interno basado en fuentes verificadas: sitio oficial CORFO, Ministerio de Economía, "
        "Comité CORFO Biobío, Diario Concepción, Portal Innova y BCN. "
        "Los datos presupuestarios y estadísticos corresponden a información pública disponible a junio de 2026.",
        NOTA_PIE))
    s.append(PageBreak())
    return s


def sec_identidad():
    s = []
    s.append(band("1.  IDENTIDAD INSTITUCIONAL DE CORFO"))
    s.append(sp())

    s.append(Paragraph("Misión", SUBSEC))
    s.append(Paragraph(
        "<i>\"Mejorar la competitividad y la diversificación productiva del país, fomentando la inversión, "
        "la innovación y el emprendimiento, y fortaleciendo el capital humano y las capacidades tecnológicas "
        "para alcanzar el desarrollo sostenible y territorialmente equilibrado.\"</i>", CITA))

    s.append(Paragraph("Visión", SUBSEC))
    s.append(Paragraph(
        "<i>\"Ser una agencia de clase mundial que logra los propósitos establecidos en su misión, "
        "articulando en forma colaborativa ecosistemas productivos y sectores con alto potencial para "
        "proyectar a Chile hacia la nueva economía del conocimiento.\"</i>", CITA))

    s.append(Paragraph("Historia resumida", SUBSEC))
    hitos = [
        ("29 abr. 1939", "Creación de CORFO bajo el gobierno de Pedro Aguirre Cerda (Frente Popular), "
                         "en respuesta al terremoto de Chillán de enero de 1939 y la crisis de los años 30. "
                         "Su mandato original fue impulsar la industrialización nacional y coordinar la reconstrucción del país."),
        ("1940s–1970s",  "CORFO lidera el modelo de sustitución de importaciones: funda o participa en ENAP, ENDESA, CAP, IANSA, ENTEL, Lan Chile y otras empresas estratégicas."),
        ("1980s–1990s",  "Con la liberalización económica, CORFO transita desde la producción directa al fomento: apoya a PYMEs, financia innovación y emprendimiento."),
        ("2015–hoy",     "Foco en innovación, emprendimiento de base tecnológica, capital humano, H2V y descentralización. "
                         "Se crean los Comités de Desarrollo Productivo Regional (CDPR) para acercar los instrumentos a los territorios."),
        ("2024–2026",    "Énfasis en transformación productiva sostenible, litio, H2V, economía circular y apoyo a regiones industriales en transición (como Biobío post-Huachipato)."),
    ]
    s.append(tabla2(hitos, w1=0.20))

    s.append(sp(0.4))
    s.append(Paragraph("Escala nacional (2024–2025)", SUBSEC))
    ind = [
        ("Subsidios entregados (2024)",    "> $181 mil millones de pesos — 97% a MiPymes"),
        ("Trabajadoras/es CORFO",          "1.059 personas (2025): 52,31% mujeres — 1ª gerenta general en la historia"),
        ("Comités Regionales",             "16 Comités de Desarrollo Productivo Regional en todo Chile"),
        ("Actores beneficiados (CDPR)",    "> 1.520 actores del ecosistema productivo nacional"),
        ("Presupuesto innovación 2025",    "> $3.400 millones en 13 instrumentos de Fomento Empresarial + 6 de Innovación"),
        ("Prog. Desarrollo Prod. Sostenible","$102 mil millones orientados en 2024 (fondos litio Salar de Atacama)"),
    ]
    s.append(tabla_ind(ind))
    s.append(PageBreak())
    return s


def sec_marco_legal():
    s = []
    s.append(band("2.  MARCO LEGAL Y NORMATIVO"))
    s.append(sp())

    s.append(Paragraph("Naturaleza jurídica", SUBSEC))
    s.append(Paragraph(
        "CORFO es una <b>empresa del Estado</b> creada por ley, con personalidad jurídica propia, patrimonio "
        "propio y dependencia del <b>Ministerio de Economía, Fomento y Turismo</b>. No es un servicio público "
        "tradicional, sino una entidad de fomento con autonomía relativa de gestión pero sujeta a las normas "
        "de la administración financiera del Estado y a la fiscalización de la Contraloría General de la República.", CUERPO))
    s.append(sp(0.2))
    s.append(destacado(
        "Clave práctica",
        "Los trabajadores de CORFO (nivel nacional) se rigen por el <b>Código del Trabajo</b>, no por el "
        "Estatuto Administrativo. El Comité Regional opera como unidad ejecutora y sus contratos siguen "
        "las normas de compras públicas (Ley 19.886) y el Reglamento de Rendición de Cuentas de CORFO.",
        bg=colors.HexColor("#E5EFF8")))

    s.append(Paragraph("Normativa principal", SUBSEC))
    normas = [
        ("DFL N° 211 / Ley 6.640 (1939, mod.)",
         "Ley orgánica de CORFO. Crea la Corporación, define su misión, estructura de gobierno (Consejo, Vicepresidencia Ejecutiva), "
         "patrimonio y atribuciones. Ha sido modificada numerosas veces para adaptar el mandato al contexto económico."),
        ("D.L. N° 1.263 (1975)",
         "Orgánico de Administración Financiera del Estado. Regula la elaboración, aprobación y ejecución del presupuesto de CORFO, "
         "incluyendo los informes que debe remitir a la DIPRES y las condiciones de gasto fiscal."),
        ("Ley de Presupuestos (anual)",
         "Define la asignación presupuestaria de CORFO y los Comités Regionales para cada ejercicio. "
         "Los reajustes, suplementos y transferencias requieren aprobación previa de DIPRES."),
        ("Ley N° 19.886 (Compras Públicas)",
         "Rige todos los contratos de suministro y servicios de CORFO. Obliga a usar ChileCompra para procesos de licitación."),
        ("Ley N° 20.285 (Transparencia)",
         "Sujeta a CORFO a publicar en transparencia activa: estructura orgánica, remuneraciones, contratos, dotación, "
         "transferencias y auditorías. Obliga a responder solicitudes de información pública ante el CPLT."),
        ("Ley N° 20.416 (Estatuto Pyme)",
         "Define el marco de apoyo estatal a las empresas de menor tamaño. CORFO es el principal ejecutor de esta política "
         "a través de sus instrumentos de capital semilla, créditos y formación."),
        ("Ley N° 20.936 (Política de I+D)",
         "Regula la Ley de Incentivo Tributario a la I+D, cuya fiscalización técnica corresponde a CORFO."),
        ("Reglamento de Rendición de Cuentas CORFO",
         "Norma interna que regula cómo los beneficiarios de instrumentos de fomento deben rendir los subsidios recibidos. "
         "El Comité Regional supervisa estas rendiciones en el territorio."),
    ]
    s.append(tabla2(normas, w1=0.28))

    s.append(sp(0.4))
    s.append(Paragraph("Gobierno corporativo de CORFO", SUBSEC))
    gob = [
        ("Consejo de CORFO",
         "Máximo órgano de gobierno. Preside el Ministro de Economía. Integran además los ministros de Hacienda, "
         "Relaciones Exteriores, Minería y Obras Públicas, más tres consejeros designados por el Presidente de la República. "
         "Aprueba planes, presupuesto y política general de la corporación."),
        ("Vicepresidente Ejecutivo",
         "Dirige la gestión diaria de CORFO. Es nombrado por el Presidente de la República a propuesta del Ministro de Economía. "
         "Cargo vigente en proceso de transición (José Miguel Benavente hasta nov. 2025)."),
        ("DIPRES",
         "La Dirección de Presupuestos debe aprobar previamente las propuestas de gasto que involucren recursos fiscales, "
         "incluyendo los traspasos desde CORFO al Tesoro Público — tema que generó controversia pública en 2025."),
    ]
    s.append(tabla2(gob, w1=0.26))

    s.append(sp(0.3))
    s.append(alerta(
        "Controversia 2025",
        "En febrero de 2025 surgió un debate público por 'billonarios traspasos de CORFO al Tesoro Público'. "
        "El VP Benavente inicialmente se abstuvo en el Consejo y luego cambió de posición. "
        "El tema involucra las ganancias derivadas de los contratos de explotación del litio del Salar de Atacama. "
        "Como Director/a Regional debes conocer este contexto, ya que afecta la imagen pública de CORFO "
        "y puede generar preguntas de actores del ecosistema regional."))
    s.append(PageBreak())
    return s


def sec_estructura():
    s = []
    s.append(band("3.  ESTRUCTURA ORGANIZACIONAL"))
    s.append(sp())

    s.append(Paragraph("Nivel nacional", SUBSEC))
    nac = [
        ("Consejo de CORFO",
         "Órgano superior de gobierno. Presidido por el Ministro de Economía."),
        ("Vicepresidencia Ejecutiva",
         "Dirección estratégica y operacional de CORFO a nivel nacional."),
        ("Gerencia de Emprendimiento",
         "Carmen Contreras. Instrumentos de capital semilla, aceleradoras, ecosistemas de emprendimiento."),
        ("Gerencia de Innovación",
         "Jocelyn Olivari. Programas I+D, transferencia tecnológica, capital humano para innovación."),
        ("Gerencia de Financiamiento e Inversiones",
         "Francisco Meneses. Créditos CORFO, capital de riesgo, banca de desarrollo."),
        ("Gerencia de Redes y Competitividad",
         "Programas Transforma, Bienes Públicos, encadenamientos productivos, clústeres."),
        ("Gerencia de Administración y Finanzas",
         "Gestión presupuestaria, adquisiciones, RRHH, sistemas de información."),
        ("InnovaChile",
         "Comité especializado en innovación empresarial; ejecuta gran parte de los instrumentos de I+D y emprendimiento innovador."),
        ("16 Comités Regionales (CDPR)",
         "Unidades ejecutoras territoriales con directores ejecutivos regionales nombrados por el comité respectivo."),
    ]
    s.append(tabla2(nac, w1=0.30))

    s.append(sp(0.4))
    s.append(Paragraph("Modelo de los Comités de Desarrollo Productivo Regional (CDPR)", SUBSEC))
    s.append(Paragraph(
        "Los CDPR son el brazo territorial de CORFO. Funcionan como organismos con gobernanza "
        "público-privada, con un <b>Directorio</b> integrado por representantes del sector público "
        "(Gobernador Regional, Seremis, CORFO Nacional) y privado (gremios empresariales, academia). "
        "El <b>Director/a Ejecutivo/a</b> del Comité es nombrado/a por este Directorio en proceso competitivo.",
        CUERPO))
    s.append(sp(0.2))
    s.append(destacado(
        "Clave Biobío",
        "El Comité CORFO Biobío no es equivalente a una 'Dirección Regional' de un servicio público tradicional. "
        "Su directora ejecutiva, Roberta Lama, fue <b>elegida con 11 de 12 votos</b> del Directorio regional en junio 2022. "
        "Esta gobernanza mixta significa que el cargo tiene mandato propio y legitimidad regional, "
        "no solo delegación jerárquica desde Santiago.",
        bg=colors.HexColor("#E8F4EA")))

    s.append(sp(0.35))
    s.append(Paragraph("Estructura típica del Comité CORFO Biobío", SUBSEC))
    reg = [
        ("Director/a Ejecutivo/a",
         "Lidera el Comité. Responde al Directorio regional. Representa a CORFO ante autoridades, empresas y ecosistema. "
         "Directora actual: Roberta Lama Bedwell (abogada, Mgtr. Derecho Empresarial; ex-gerenta Desarrolla Biobío, "
         "ex-vicerrectora UCSC, ex-jefa A&F GORE Biobío)."),
        ("Encargado/a de Fomento Empresarial",
         "Gestiona instrumentos de productividad y competitividad para PYMEs: Desarrolla, Gestión de Innovación, etc."),
        ("Encargado/a de Emprendimiento e Innovación",
         "Coordina programas de capital semilla, aceleradoras, Semilla Inicia, Potencia, Startup Biobío, etc."),
        ("Encargado/a de Proyectos Estratégicos",
         "Gestiona programas Transforma (Biobío Madera, H2V) y el Plan de Fortalecimiento Industrial Biobío."),
        ("Encargado/a de Administración y Finanzas",
         "Presupuesto regional, rendición de subsidios, compras públicas, contratos y RRHH del Comité."),
        ("Encargado/a de Comunicaciones",
         "Difusión de convocatorias, relaciones con medios, vocería territorial, redes sociales."),
        ("Ejecutivos Técnicos (varios)",
         "Profesionales especializados que acompañan a las empresas en la formulación y seguimiento de proyectos postulados."),
    ]
    s.append(tabla2(reg, w1=0.27))
    s.append(PageBreak())
    return s


def sec_rol():
    s = []
    s.append(band("4.  ROL Y FUNCIONES DEL/A DIRECTOR/A EJECUTIVO/A REGIONAL"))
    s.append(sp())

    s.append(Paragraph("Definición del cargo", SUBSEC))
    s.append(Paragraph(
        "El/la <b>Director/a Ejecutivo/a del Comité de Desarrollo Productivo Regional</b> es el/la "
        "representante institucional de CORFO en el territorio. Es nombrado/a por el Directorio del Comité "
        "mediante concurso o proceso de selección público-privado, y responde a dicho Directorio. "
        "A diferencia de la mayoría de los jefes de servicio regionales, <b>no es cargo de exclusiva confianza "
        "del gobierno central</b>, sino que tiene mandato territorial con legitimidad autónoma.",
        CUERPO))
    s.append(sp(0.2))
    s.append(destacado(
        "Perfil declarado",
        "Roberta Lama articuló el perfil del cargo al asumir: 'Queremos descentralizar y salir del lenguaje "
        "corfiano, y hablarle al territorio.' El cargo exige combinar visión estratégica de desarrollo "
        "económico regional con ejecución efectiva de instrumentos de fomento.",
        bg=colors.HexColor("#FFF8E1")))

    s.append(Paragraph("A) Representación y articulación territorial", SUBSEC))
    s += bullets([
        "Representar a CORFO ante el <b>Gobernador Regional, GORE, Seremis, municipios y gremios empresariales</b> de Biobío.",
        "Participar activamente en mesas de trabajo del <b>Plan de Fortalecimiento Industrial del Biobío</b> y coordinar con el Ministerio de Economía la ejecución de las 32 medidas comprometidas.",
        "Articular con el ecosistema regional: universidades (CRUCH Biobío y Ñuble, C4i UdeC), aceleradoras (Startup Biobío), gremios (CPC Biobío, SII, ProChile) y centros tecnológicos.",
        "Ser la contraparte regional de las Gerencias Nacionales de CORFO (Emprendimiento, Innovación, Financiamiento, Redes).",
        "Participar en la <b>agenda exportadora regional</b> en coordinación con ProChile Biobío.",
    ])

    s.append(Paragraph("B) Gestión de instrumentos de fomento", SUBSEC))
    s += bullets([
        "Planificar y ejecutar el <b>portafolio anual de instrumentos CORFO</b> en la región: apertura de convocatorias, difusión, evaluación de proyectos y seguimiento.",
        "Asegurar que el presupuesto regional aprobado (M$4.574.173 en 2026) sea ejecutado en su totalidad con eficiencia y oportunidad.",
        "Gestionar el <b>apalancamiento de fondos regionales (GORE)</b> para ampliar el presupuesto efectivo (de M$4.574 a M$5.751 millones en 2026).",
        "Supervisar los proyectos estratégicos regionales: <b>Biobío Madera</b>, <b>Anillos Industriales H2V</b> y <b>Biobío Circular</b>.",
        "Coordinar la rendición de subsidios por parte de las empresas beneficiarias, garantizando cumplimiento documental total.",
    ])

    s.append(Paragraph("C) Planificación estratégica del territorio", SUBSEC))
    s += bullets([
        "Diseñar y actualizar el <b>Plan de Trabajo Anual</b> del Comité, con metas por sector estratégico, instrumentos y comunas.",
        "Identificar brechas de competitividad e innovación en las 33 comunas de Biobío y priorizar territorialmente los recursos disponibles.",
        "Levantar <b>necesidades sectoriales específicas</b> de los sectores madera, pesca, agroindustria, H2V, construcción naval y turismo.",
        "Proponer al Directorio ajustes al portafolio de instrumentos cuando los instrumentos nacionales no calzan con las necesidades del territorio ('salir del lenguaje corfiano').",
    ])

    s.append(Paragraph("D) Gestión del equipo del Comité", SUBSEC))
    s += bullets([
        "Liderar al equipo profesional del Comité: ejecutivos técnicos, encargados de área y personal de apoyo.",
        "Garantizar la capacitación continua del equipo en los instrumentos vigentes y en las características del tejido empresarial regional.",
        "Gestionar la contratación y desvinculación de personal conforme al Código del Trabajo y los procedimientos del Comité.",
        "Mantener un clima organizacional de alto desempeño, orientado al servicio a las empresas y emprendimientos del territorio.",
    ])

    s.append(Paragraph("E) Transparencia y rendición", SUBSEC))
    s += bullets([
        "Publicar en transparencia activa: dotación, remuneraciones, contratos y subsidios adjudicados.",
        "Presentar <b>Cuenta Pública Anual</b> con resultados de gestión, inversión ejecutada y empresas beneficiadas.",
        "Responder solicitudes de información bajo Ley 20.285 en los plazos legales.",
        "Supervisar que todos los beneficiarios rindan el 100% del subsidio con documentación completa (facturas, informes técnicos).",
    ])

    s.append(sp(0.3))
    s.append(Paragraph("Atribuciones formales del cargo", SUBSEC))
    atrib = [
        ("Representación",       "Actuar en nombre del Comité CORFO Biobío ante organismos públicos, privados y la academia en el territorio regional."),
        ("Aprobación de proyectos","Aprobar proyectos dentro de los montos y condiciones establecidos por el Directorio y los marcos normativos de cada instrumento."),
        ("Administración presupuestaria","Administrar el presupuesto anual del Comité y gestionar el apalancamiento de fondos regionales ante el GORE."),
        ("Gestión de personas",  "Contratar y liderar al equipo del Comité Regional conforme al Código del Trabajo."),
        ("Firma de contratos",   "Suscribir los contratos de subsidio con las empresas beneficiarias de instrumentos de fomento."),
        ("Vocería",              "Representar públicamente a CORFO en el territorio: prensa, eventos, cuentas públicas."),
    ]
    s.append(tabla2(atrib, w1=0.25))
    s.append(PageBreak())
    return s


def sec_biobio():
    s = []
    s.append(band("5.  CORFO BIOBÍO — TERRITORIO, DATOS Y ECOSISTEMA", CORFO_VERDE))
    s.append(sp())

    datos = [
        ("Nombre oficial",          "Comité de Desarrollo Productivo Regional Biobío"),
        ("Sede",                    "Rengo 476, piso 4, Concepción · consultas@fomentobiobio.cl"),
        ("Teléfono",                "(+41) 2907700"),
        ("Comunas de cobertura",    "33 comunas de la Región del Biobío (provincias de Concepción, Biobío y Arauco)"),
        ("Directora Ejecutiva",     "Roberta Lama Bedwell (desde junio 2022)"),
        ("Presupuesto 2026 (Ley)",  "M$4.574.173 (pesos)"),
        ("Presupuesto 2026 total",  "M$5.751.173 con fondos regionales apalancados"),
        ("Resultados 2025",         "201 proyectos aprobados — +$6.400 millones ejecutados"),
        ("Inversión 2024",          "Creció más de $10 mil millones respecto a 2023"),
        ("Website",                 "fomentobiobio.gob.cl"),
    ]
    s.append(tabla2(datos))

    s.append(sp(0.4))
    s.append(Paragraph("Sectores estratégicos del territorio", SUBSEC))
    sectores = [
        ("H2 Verde (H2V)",
         "Eje prioritario nacional con acento en Biobío. CORFO adjudicó US$10 millones a dos proyectos de Anillos Industriales "
         "(MarVal y Fosfoquim) en ene. 2026, con demanda proyectada de 1.300 toneladas/año de H2V. Aplicaciones: transporte pesado y producción química. "
         "Se instalará un Centro Tecnológico para Transición Energética con inversión de US$10M en 10 años."),
        ("Madera / Construcción Industrializada",
         "Programa Biobío Madera (Proyecto Transforma CORFO): el CORE aprobó $6.000 millones en marzo 2024. "
         "Foco en construcción industrializada en madera con sello de carbono neutralidad. "
         "Chile tiene ventaja comparativa por la industria forestal del Biobío."),
        ("Construcción Naval",
         "Nuevo eje estratégico incluido en el Plan de Fortalecimiento Industrial Biobío 2024. "
         "La política nacional de construcción naval identifica al Biobío como hub por su tradición portuaria e industrial."),
        ("Pesca y Acuicultura",
         "Plan nacional para fortalecer la pesquería del jurel. Iniciativas de innovación para emprendedoras del mar "
         "(Arauco, febrero 2025). Sector de alta empleabilidad en la provincia de Arauco."),
        ("Agroindustria",
         "Apoyo a absorción tecnológica e innovación en PYMEs agroindustriales. Sector 2 del Plan Industrial Biobío. "
         "Afectado por cambio climático (variación en capacidad extractiva y productiva)."),
        ("Economía Circular",
         "Programa Biobío Circular: 40 emprendimientos seleccionados en junio 2026. Financiado por CORFO con respaldo técnico del Centro EULA (UdeC). "
         "Transforma desafíos ambientales en oportunidades de negocio."),
        ("Industrias Inteligentes / TICs",
         "Startup Biobío (aceleradora ligada a CORFO): 30 founders con $2,8M en ventas en 2026. "
         "Concepción fue sede del Primer Encuentro de Ecosistemas Regionales de Chile, posicionando la ciudad como hub de innovación."),
    ]
    s.append(tabla2(sectores, w1=0.22))

    s.append(sp(0.4))
    s.append(Paragraph("Actores estratégicos del ecosistema", SUBSEC))
    actores = [
        ("GORE Biobío",             "Principal aliado para apalancamiento de fondos regionales. El Gobernador Regional puede co-financiar programas CORFO hasta elevar el presupuesto ejecutable un 25%."),
        ("CRUCH Biobío y Ñuble",    "Red de universidades regionales. CORFO articuló agenda conjunta en enero 2026 para fortalecer innovación y desarrollo. UdeC, UBB, UCSC son socios clave."),
        ("C4i — UdeC",              "Centro de innovación CORFO-UdeC. Opera como punto de articulación entre academia y empresa para proyectos de I+D aplicada."),
        ("Startup Biobío",          "Aceleradora regional con apoyo CORFO. 4 meses de programa, foco en empresas TIC con tracción que buscan internacionalización."),
        ("ProChile Biobío",         "Coordinación para agenda exportadora. Articulación en instrumentos GoGlobal y estrategia conjunta de internacionalización de PYMEs."),
        ("CPC Biobío / Gremios",    "Cámara de Comercio, Cámara Chilena de la Construcción, ASIPES (pesca), gremios forestales: contrapartes permanentes en el Directorio del Comité."),
        ("Seremi de Economía",       "Articulación de política económica regional. Referente para la implementación del Plan de Fortalecimiento Industrial Biobío."),
        ("SERCOTEC Biobío",         "Instrumento complementario para microempresas. Coordinación para evitar superposición de beneficios y maximizar cobertura del ecosistema."),
        ("CORFO Nacional",          "Gerencias de Emprendimiento, Innovación y Redes: contrapartes directas del Director/a Regional para diseño y ajuste de instrumentos."),
    ]
    s.append(tabla2(actores, w1=0.27))
    s.append(PageBreak())
    return s


def sec_instrumentos():
    s = []
    s.append(band("6.  INSTRUMENTOS Y PROGRAMAS PRINCIPALES"))
    s.append(sp())

    s.append(Paragraph("Instrumentos de emprendimiento e innovación", SUBSEC))
    emp = [
        ("Semilla Inicia Biobío",
         "Capital semilla para startups en etapa inicial. Cofinanciamiento de hasta $17M (mujeres) / $15M (hombres). "
         "Foco en sostenibilidad, transición energética, economía circular y salud."),
        ("Potencia 2025",
         "Apoya a incubadoras y aceleradoras: subsidio de hasta $240M por 3 años ($80M/etapa). "
         "Disponible en Biobío junto a otras 7 regiones prioritarias."),
        ("Expande",
         "Para emprendimientos ya validados comercialmente que buscan escalar a nivel nacional o internacional. "
         "Cofinanciamiento hasta 75%, tope $25 millones."),
        ("GoGlobal",
         "Softlanding e internacionalización de empresas innovadoras. Mercados: Perú, Colombia, México, EEUU y España."),
        ("Viraliza Formación",
         "Apoya a entidades que desarrollan programas de formación en emprendimiento e innovación."),
        ("Capital Humano para la Innovación",
         "Subsidio a empresas para contratar expertos externos que impulsen proyectos innovadores. "
         "Más de 70 empresas nacionales contrataron capital humano experto en 2025."),
    ]
    s.append(tabla2(emp, w1=0.25))

    s.append(sp(0.3))
    s.append(Paragraph("Instrumentos de innovación empresarial (I+D)", SUBSEC))
    inno = [
        ("Crea y Valida",
         "I+D para empresas. Apoyó más de 140 proyectos entre 2024-2025. Cofinancia desarrollo de innovaciones que requieran investigación."),
        ("Consolida y Expande Innovación",
         "Para empresas que ya innovaron y buscan escalar la solución al mercado."),
        ("Innova Alta Tecnología",
         "Proyectos de alto componente tecnológico y científico. Articulado con universidades del CRUCH."),
        ("Innova Región",
         "Instrumento con convocatoria regional para innovaciones pertinentes al territorio."),
        ("Ley I+D (incentivo tributario)",
         "CORFO certifica proyectos de I+D que pueden acceder al beneficio tributario del 35%. "
         "Fundamental para empresas medianas y grandes del sector forestal, pesca e industria."),
        ("PATI",
         "Programa de Absorción Tecnológica Internacional. Apoya a empresas en adoptar tecnologías del exterior."),
    ]
    s.append(tabla2(inno, w1=0.25))

    s.append(sp(0.3))
    s.append(Paragraph("Instrumentos de fomento empresarial y productividad", SUBSEC))
    fom = [
        ("Gestión de la Innovación Pymes",
         "Grupos de empresas que adoptan cultura de innovación. CORFO cofinancia hasta 70% con tope $7,2M/empresa y $72M/proyecto."),
        ("Desarrolla Inversión",
         "Inversión productiva con foco en construcción sostenible en madera en Biobío. "
         "Apoya proyectos de modernización de planta y adopción tecnológica."),
        ("Bienes Públicos para la Competitividad",
         "Financia estudios, estándares, plataformas y otros bienes colectivos que mejoran la competitividad sectorial."),
        ("Anillos Industriales H2V",
         "Instrumento estratégico para encadenamiento productivo en torno al hidrógeno verde. "
         "CORFO aporta hasta 52% del costo total. En Biobío: MarVal y Fosfoquim (US$10M)."),
        ("Programas Transforma",
         "Programas de largo plazo para transformar sectores estratégicos. En Biobío: Biobío Madera y H2V Biobío."),
    ]
    s.append(tabla2(fom, w1=0.27))

    s.append(sp(0.3))
    s.append(Paragraph("Financiamiento (banca de desarrollo)", SUBSEC))
    fin = [
        ("Créditos CORFO",          "Líneas de crédito para inversión y capital de trabajo a tasas preferenciales, canalizadas a través de la banca comercial."),
        ("Capital de Riesgo",       "CORFO co-invierte con fondos de capital de riesgo privados en startups y empresas de alto crecimiento."),
        ("Garantías CORFO",         "Garantías estatales que permiten a PYMEs acceder a créditos bancarios con menores exigencias de garantías reales."),
    ]
    s.append(tabla2(fin, w1=0.25))
    s.append(PageBreak())
    return s


def sec_plan_industrial():
    s = []
    s.append(band("7.  PLAN DE FORTALECIMIENTO INDUSTRIAL BIOBÍO (2024–2030)"))
    s.append(sp())

    s.append(Paragraph(
        "El <b>Plan de Fortalecimiento Industrial del Biobío</b> fue lanzado el 16 de septiembre de 2024 "
        "por el Ministro de Economía, como respuesta al cierre de la planta de acero <b>Huachipato (CAP)</b>, "
        "que afectó directamente a cientos de proveedores y miles de empleos en la región. "
        "CORFO es uno de los principales actores ejecutores del Plan, junto al GORE, Ministerios de MOP, "
        "Trabajo y Minería.", CUERPO))
    s.append(sp(0.2))

    resumen = [
        ("Medidas totales",      "32 medidas articuladas en 5 ejes estratégicos"),
        ("Inversión meta total", "Más de US$9.000 millones entre inversión pública y privada"),
        ("Plazo",                "Horizonte 2024–2030 con revisiones anuales"),
        ("Origen",               "Respuesta al cierre de Huachipato y la necesidad de diversificar la matriz industrial regional"),
        ("Coordinación",         "Comité Interministerial presidido por el Ministerio de Economía — CORFO es co-ejecutor central"),
    ]
    s.append(tabla_ind(resumen))

    s.append(sp(0.3))
    s.append(Paragraph("Los 5 ejes estratégicos del Plan", SUBSEC))
    ejes = [
        ("Eje 1 — Apoyo a proveedores de Huachipato",
         "Acompañamiento y reconversión de empresas proveedoras de CAP Huachipato. "
         "Acceso a financiamiento de emergencia, reconversión productiva y nuevos mercados."),
        ("Eje 2 — Nuevos sectores industriales",
         "H2V, construcción naval, energías renovables y economía circular como nuevos motores de desarrollo. "
         "CORFO ejecuta los instrumentos de I+D, anillos industriales y programas Transforma."),
        ("Eje 3 — Fortalecimiento de sectores existentes",
         "Industria forestal-maderera, pesquería del jurel, agroindustria y logística portuaria. "
         "Modernización tecnológica, descarbonización y nuevos mercados de exportación."),
        ("Eje 4 — Inversión pública acelerada",
         "Adelantamiento y aceleración de proyectos de infraestructura pública: MOP, MINVU, Municipios. "
         "Generación de empleo de corto y mediano plazo."),
        ("Eje 5 — Ecosistema de innovación y emprendimiento",
         "Fortalecimiento de C4i, Startup Biobío, redes de mentores y vinculación CRUCH-empresa. "
         "CORFO ejecuta los instrumentos Semilla, Potencia, Gestión de Innovación Pymes e Innova Región."),
    ]
    s.append(tabla2(ejes, w1=0.28))

    s.append(sp(0.35))
    s.append(destacado(
        "Tu rol en el Plan",
        "Como Director/a Ejecutivo/a Regional, eres la contraparte territorial de este Plan ante el "
        "Ministerio de Economía, el GORE y los actores empresariales. Debes conocer el estado de avance "
        "de cada una de las 32 medidas y reportar trimestralmente a la mesa interministerial.",
        bg=colors.HexColor("#FFF8E1")))
    s.append(PageBreak())
    return s


def sec_desafios():
    s = []
    s.append(band("8.  DESAFÍOS Y HABILIDADES CLAVE"))
    s.append(sp())

    s.append(Paragraph("Desafíos del contexto (2025-2026)", SUBSEC))
    desafios = [
        ("Transición post-Huachipato",
         "La región enfrenta la reconversión de cientos de empresas proveedoras de acero y la diversificación del empleo industrial. "
         "CORFO debe ejecutar los instrumentos del Plan de Fortalecimiento con urgencia y eficacia."),
        ("Descentralización real",
         "El mandato de 'salir del lenguaje corfiano' (Roberta Lama, 2022) sigue vigente: adaptar los instrumentos nacionales a las "
         "necesidades reales del tejido empresarial de Arauco, Biobío y Concepción, incluyendo zonas rurales y comunidades costeras."),
        ("Ejecución presupuestaria",
         "El presupuesto 2026 (M$4.574 a M$5.751 millones con apalancamiento) debe ejecutarse al 100%. La sub-ejecución genera devoluciones y pérdida de legitimidad institucional."),
        ("Ecosistema fragmentado",
         "Biobío tiene actores de calidad (C4i, CRUCH, Startup Biobío) pero con coordinación insuficiente. "
         "El Director/a debe ser articulador/a central del ecosistema, no solo ejecutor de instrumentos."),
        ("Presión política post-Huachipato",
         "El Plan Industrial genera expectativas muy altas de empleadores, sindicatos y municipios. "
         "Gestionar expectativas y comunicar resultados con datos es crítico."),
        ("Traspasos CORFO al Tesoro Público",
         "La controversia sobre el uso de los excedentes de CORFO (fondos litio) afecta la imagen institucional. "
         "Conocer el contexto y comunicarlo con claridad es responsabilidad del Director/a Regional."),
        ("Desafíos climáticos",
         "El cambio en los patrones climáticos amenaza la capacidad extractiva en pesca, madera y agroindustria. "
         "Los programas de CORFO deben incorporar una lente de adaptación climática."),
        ("Inclusión y género",
         "CORFO tiene estrategia de género activa (Ellas Transforman). La Dirección Regional debe garantizar "
         "que al menos el 30% de los proyectos apoyen a empresas lideradas por mujeres."),
    ]
    s.append(tabla2(desafios, w1=0.27))

    s.append(sp(0.4))
    s.append(Paragraph("Habilidades clave para el/la Director/a Ejecutivo/a Regional", SUBSEC))
    habs = [
        ("Liderazgo estratégico territorial",
         "Capacidad de diseñar una agenda de desarrollo económico regional con visión de largo plazo y ejecución de corto plazo."),
        ("Conocimiento del ecosistema productivo",
         "Comprensión profunda de los sectores industriales, pesqueros, forestales y tecnológicos del Biobío y sus cadenas de valor."),
        ("Gestión de instrumentos de fomento",
         "Dominio técnico de los instrumentos CORFO: cómo funciona cada uno, qué empresas pueden postular, qué resultados se esperan."),
        ("Articulación público-privada",
         "Capacidad de trabajar con el GORE, los gremios empresariales, la academia y el gobierno central al mismo tiempo, con agendas distintas."),
        ("Comunicación y vocería",
         "Capacidad de traducir el lenguaje técnico de CORFO a un lenguaje accesible para emprendedores, trabajadores y medios regionales."),
        ("Gestión presupuestaria",
         "Planificación, control y ejecución del presupuesto del Comité; gestión de rendiciones y apalancamiento con GORE."),
        ("Negociación e influencia",
         "Con el Directorio del Comité, con el Ministerio de Economía para ajustes de instrumentos y con el sector privado para co-inversión."),
        ("Visión de género e inclusión",
         "Incorporar activamente el enfoque de género y diversidad territorial en la selección de proyectos apoyados."),
    ]
    s.append(tabla2(habs, w1=0.28))
    s.append(PageBreak())
    return s


def sec_plan_entrada():
    s = []
    s.append(band("9.  PLAN DE ENTRADA — PRIMEROS 90 DÍAS", CORFO_AZUL))
    s.append(sp())

    plan = [
        ("Semanas 1–2\nEscucha y contexto",
         "• Reunión 1:1 con cada integrante del equipo del Comité — escucha sus prioridades y dificultades.\n"
         "• Lee el Plan de Trabajo anual vigente, el presupuesto ejecutado a la fecha y los indicadores de proyectos activos.\n"
         "• Revisa los proyectos estratégicos en curso: Biobío Madera, H2V, Biobío Circular.\n"
         "• Estudia el estado de avance de las 32 medidas del Plan de Fortalecimiento Industrial."),
        ("Semanas 3–5\nDiagnóstico territorial",
         "• Visita al menos 3 provincias (Concepción, Biobío y Arauco) y reúnete con empresarios, gremios y alcaldes clave.\n"
         "• Primera reunión con el Gobernador Regional y el equipo del GORE para revisar convenios vigentes y apalancamiento.\n"
         "• Conecta con Seremi de Economía, ProChile, SERCOTEC y SENCE para mapear la oferta pública de fomento.\n"
         "• Reunión con C4i UdeC, Startup Biobío y directores de CRUCH para mapear el ecosistema de innovación."),
        ("Semanas 6–8\nPriorización",
         "• Define con el equipo las 3–5 prioridades estratégicas del Comité para el año.\n"
         "• Presenta diagnóstico al Directorio del Comité y propón ajustes al Plan de Trabajo si los necesitas.\n"
         "• Lanza o refuerza las convocatorias del año con campaña comunicacional en las 3 provincias.\n"
         "• Asegura que el estado de rendiciones de proyectos activos esté al día."),
        ("Semanas 9–12\nEjecución",
         "• Activa acuerdos de trabajo formal con GORE, ProChile y universidades CRUCH.\n"
         "• Establece reunión mensual de seguimiento del Plan de Fortalecimiento Industrial con el Seremi de Economía.\n"
         "• Define el calendario de Cuentas Públicas sectoriales (industria, pesca, madera, emprendimiento).\n"
         "• Instala el ritual de reunión semanal de equipo y tablero de indicadores de ejecución."),
    ]
    anchos = [ANC * 0.22, ANC * 0.78]
    colores_bg = [
        colors.HexColor("#E5EFF8"),
        colors.HexColor("#FFF8E1"),
        colors.HexColor("#E8F4EA"),
        colors.HexColor("#FFF0E8"),
    ]
    data = [[Paragraph(e, CBOLD), Paragraph(a.replace("\n", "<br/>"), CUERPO)]
            for e, a in plan]
    t = Table(data, colWidths=anchos)
    est = [
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",    (0,0), (-1,-1), 8),
        ("BOTTOMPADDING", (0,0), (-1,-1), 8),
        ("LEFTPADDING",   (0,0), (-1,-1), 8),
        ("RIGHTPADDING",  (0,0), (-1,-1), 8),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
    ]
    for i, c in enumerate(colores_bg):
        est.append(("BACKGROUND", (0, i), (0, i), c))
    t.setStyle(TableStyle(est))
    s.append(t)

    s.append(sp(0.4))
    s.append(Paragraph("Preguntas que debes poder responder antes del día 30", SUBSEC))
    pregs = [
        "¿Cuál es el estado de ejecución del presupuesto del Comité a la fecha? ¿Cuánto queda por comprometer?",
        "¿Qué proyectos estratégicos (Biobío Madera, H2V, Biobío Circular) tienen hitos críticos en los próximos 90 días?",
        "¿Cuántas convocatorias están abiertas o próximas a abrir? ¿Cuál es la demanda esperada en Biobío?",
        "¿Qué empresas proveedoras de Huachipato están siendo acompañadas activamente? ¿Con qué instrumentos?",
        "¿Cuál es el estado del convenio de apalancamiento con el GORE Biobío para 2026?",
        "¿Qué rendiciones de proyectos están atrasadas o en riesgo de observación?",
        "¿Cuáles son los sectores donde el ecosistema de Biobío tiene mayor brecha de cobertura de los instrumentos CORFO?",
    ]
    s += bullets(pregs)
    s.append(PageBreak())
    return s


def sec_fuentes():
    s = []
    s.append(band("10.  FUENTES Y REFERENCIAS", GRIS_MED))
    s.append(sp())

    fuentes = [
        ("CORFO — Sala de Prensa Nacional",                 "corfo.cl/sites/cpp/saladeprensanacional"),
        ("CORFO — Misión y Visión (Indicio.cl)",            "indicio.cl/trabajos/corfo/30122020/sobrecorfo.html"),
        ("CORFO — Wikipedia",                               "es.wikipedia.org/wiki/Corporación_de_Fomento_de_la_Producción"),
        ("Comité CORFO Biobío — Sitio oficial",             "fomentobiobio.gob.cl"),
        ("Roberta Lama asume Dirección Regional — sabes.cl","sabes.cl/2022/06/24/roberta-lama-se-convierte-en-nueva-directora"),
        ("Roberta Lama — perfil LinkedIn",                  "linkedin.com/in/roberta-lama-bedwell-06065766/"),
        ("CORFO Biobío aprueba $4.500M para 2026 — fomento","fomentobiobio.gob.cl/noticias/comite-corfo-biobio-aprueba-mas-de-4-500-millones"),
        ("Inversión CORFO Biobío creció +$10.000M en 2024", "diarioconcepcion.cl/economia/2025/01/10/monto-de-inversion-de-corfo-biobio"),
        ("Cuenta Pública CORFO 2024 — descentralización",   "corfo.cl/sites/cpp/sala_de_prensa/nacional/24_05_2024_cuenta_publica"),
        ("Plan de Fortalecimiento Industrial Biobío (PDF)", "economia.gob.cl/wp-content/uploads/2024/09/plan-de-fortalecimiento-industrial-del-biobio.pdf"),
        ("Anillos Industriales H2V Biobío — Jan 2026",      "economia.gob.cl/2026/01/09/biministro-valora-adjudicacion"),
        ("Biobío Madera — CORE aprueba $6.000M",            "corfo.cl/sites/cpp/sala_de_prensa/regional/25_03_2024_biobio_madera"),
        ("Semilla Inicia Biobío 2025",                      "fomentobiobio.gob.cl/programas-financiamiento/semilla-inicia-biobio-2025/"),
        ("Potencia 2025 — corfo.cl",                        "reporteminero.cl/noticia/noticias/2025/05/corfo-lanza-convocatoria-potencia-2025"),
        ("Biobío Circular — 40 emprendimientos",            "noticias.udec.cl/cuarenta-emprendimientos-regionales-se-suman-a-biobio-circular"),
        ("Startups Biobío 2026 — El Ecosistema Startup",    "ecosistemastartup.com/startup-biobio-2026-30-founders-con-2-8m-en-ventas"),
        ("CORFO + CRUCH Biobío y Ñuble — ene. 2026",        "noticias.ubiobio.cl/2026/01/12/corfo-y-cruch-biobio-y-nuble-articulan-agenda"),
        ("Traspasos CORFO al Tesoro — Cooperativa",         "cooperativa.cl/noticias/economia/presupuesto/nuevo-flanco-en-hacienda-por-billonarios-traspasos-de-corfo-al-tesoro"),
        ("Cuenta Pública Min. Economía 2025",               "economia.gob.cl/wp-content/uploads/2026/03/cpp-2025-1.pdf"),
        ("BCN — Marco normativo CORFO",                     "bcn.cl/leychile/Consulta/listado_n_sel?sub=651&agr=1048"),
    ]

    data = [[Paragraph("<b>N°</b>", CBOLD),
             Paragraph("<b>Fuente</b>", CBOLD),
             Paragraph("<b>Referencia</b>", CBOLD)]]
    for i, (t, u) in enumerate(fuentes, 1):
        data.append([
            Paragraph(str(i), CUERPO),
            Paragraph(t, CUERPO),
            Paragraph(u, E("URL", fontSize=7.5, leading=11,
                           textColor=CORFO_CELESTE, fontName="Helvetica")),
        ])
    anchos = [ANC * 0.05, ANC * 0.42, ANC * 0.53]
    t = Table(data, colWidths=anchos)
    t.setStyle(TableStyle([
        ("BACKGROUND",    (0,0), (-1,0), CORFO_AZUL),
        ("TEXTCOLOR",     (0,0), (-1,0), BLANCO),
        ("GRID",          (0,0), (-1,-1), 0.3, colors.HexColor("#CCCCCC")),
        ("TOPPADDING",    (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LEFTPADDING",   (0,0), (-1,-1), 6),
        ("RIGHTPADDING",  (0,0), (-1,-1), 6),
        ("VALIGN",        (0,0), (-1,-1), "TOP"),
        ("ROWBACKGROUNDS",(0,1), (-1,-1), [BLANCO, GRIS_CLARO]),
    ]))
    s.append(t)
    s.append(sp(0.4))
    s.append(HRFlowable(width="100%", thickness=1, color=CORFO_CELESTE))
    s.append(sp(0.2))
    s.append(Paragraph(
        "Documento elaborado con investigación multi-fuente y verificación cruzada de datos. "
        "Los datos presupuestarios y estadísticos tienen al menos 2 fuentes independientes de respaldo. "
        "Válido a junio de 2026. Para información actualizada: corfo.cl y fomentobiobio.gob.cl.",
        NOTA_PIE))
    return s


# ── Ensamblado final ───────────────────────────────────────────────────────
def generar(ruta):
    doc = SimpleDocTemplate(
        ruta, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=1.6 * cm, bottomMargin=1.8 * cm,
        title="CORFO — Comité Desarrollo Productivo Regional Biobío",
        author="Investigación multi-fuente · Junio 2026",
        subject="Rol, Marco Legal y Contexto Institucional",
    )
    story = []
    story += portada()
    story += sec_identidad()
    story += sec_marco_legal()
    story += sec_estructura()
    story += sec_rol()
    story += sec_biobio()
    story += sec_instrumentos()
    story += sec_plan_industrial()
    story += sec_desafios()
    story += sec_plan_entrada()
    story += sec_fuentes()
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generado: {ruta}")


if __name__ == "__main__":
    generar("/home/user/dotfiles/CORFO_Biobio_DirectorRegional.pdf")
