import os
import json
import re
from typing import List, Dict, Any

# Intentar importar el SDK de Google Generative AI
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

# Configurar Gemini si la clave API está presente
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if HAS_GEMINI and GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Usar el modelo recomendado gemini-2.5-flash
    MODEL_NAME = "gemini-2.5-flash"
else:
    HAS_GEMINI = False


def _heuristic_match(description: str, convocatoria: Dict[str, Any]) -> Dict[str, Any]:
    """
    Algoritmo de matching heurístico de respaldo (cuando no hay API Key de Gemini).
    Calcula la afinidad basándose en palabras clave y áreas temáticas.
    """
    desc_lower = description.lower()
    titulo_lower = convocatoria["titulo"].lower()
    conv_desc_lower = convocatoria["descripcion"].lower()
    
    # 1. Analizar temáticas del proyecto vs temática de la convocatoria
    tematica = convocatoria["tematica"].lower()
    score = 20  # Base score
    
    # Evaluar palabras clave de la temática
    keywords = {
        "modernizacion del estado": ["estado", "gubernamental", "municipio", "trámite", "digitalización", "público", "catastro", "gestión"],
        "ciencia de datos": ["datos", "data", "ciencia", "analítica", "predictivo", "estadística", "visualización", "big data"],
        "inteligencia artificial": ["ia", "ai", "artificial", "machine learning", "aprendizaje", "redes neuronales", "automatización", "nlp", "llm"],
        "huella de carbono": ["carbono", "huella", "emisiones", "sostenible", "verde", "eficiencia energética", "renovable", "ambiental", "clima"],
        "forestoindustria": ["forestoindustria", "forestal", "madera", "aserradero", "celulosa", "pino", "eucalipto", "maderero", "biomasa"],
        "sector primario": ["agrícola", "ganadero", "ganadería", "agricultura", "riego", "cosecha", "campo", "agro", "productor", "arroz", "citrus"],
        "infraestructura vial": ["ruta", "vial", "camino", "transporte", "logística", "pavimento", "concesión", "asfalto", "puente"]
    }
    
    # Coincidencia de la temática principal de la convocatoria en el texto del proyecto
    if tematica in desc_lower:
        score += 30
    
    # Coincidencia de palabras clave asociadas
    kw_hits = 0
    for kw in keywords.get(tematica, []):
        if kw in desc_lower:
            kw_hits += 1
            score += 5
    score = min(score, 70)  # Limitar hasta 70 puntos por temáticas y palabras clave
    
    # 2. Elegibilidad regional (Corrientes)
    es_elegible_corrientes = False
    destinatarios = [d.lower() for d in convocatoria["destinatarios"]]
    ambito = convocatoria["ambito"].lower()
    
    # Detección de destinatarios en la descripción del proyecto
    es_empresa_proyecto = any(w in desc_lower for w in ["empresa", "pyme", "privado", "emprendedor", "compañia", "cooperativa"])
    es_gobierno_proyecto = any(w in desc_lower for w in ["gobierno", "provincia", "municipio", "ente", "público", "ministerio", "secretaria"])
    
    es_empresa_convocatoria = any(w in destinatarios for w in ["empresas", "pymes", "productores agropecuarios", "emprendedores"])
    es_gobierno_convocatoria = any(w in destinatarios for w in ["gobierno provincial", "municipios", "entes públicos"])
    
    # Verificar compatibilidad de tipo de actor
    match_actor = False
    if es_empresa_proyecto and es_empresa_convocatoria:
        match_actor = True
    if es_gobierno_proyecto and es_gobierno_convocatoria:
        match_actor = True
    if not es_empresa_proyecto and not es_gobierno_proyecto: # No especificado
        match_actor = True
        
    if match_actor:
        score += 15
        
    # Verificar compatibilidad regional para Corrientes
    menciones_corrientes = any(w in desc_lower for w in ["corrientes", "litoral", "nordeste", "nea"])
    if menciones_corrientes or "corrientes" in convocatoria["organismo"].lower() or "corrientes" in convocatoria["descripcion"].lower():
        score += 15
        es_elegible_corrientes = True
    elif "nacional" in ambito or "internacional" in ambito:
        # Los nacionales e internacionales suelen aplicar a Corrientes por defecto
        score += 10
        es_elegible_corrientes = True
    else:
        # Si es de otra provincia específica, bajar el score
        score -= 20
        es_elegible_corrientes = False
        
    score = max(0, min(100, score))
    
    # Crear análisis
    analisis = f"La convocatoria '{convocatoria['titulo']}' de {convocatoria['organismo']} tiene una afinidad estimada del {score}% con tu proyecto. "
    if es_elegible_corrientes:
        analisis += "El proyecto es elegible ya que la convocatoria aplica a nivel " + convocatoria["ambito"] + " y cubre los perfiles detectados."
    else:
        analisis += "Atención: Verifica los requisitos regionales de esta convocatoria ya que su foco geográfico podría no coincidir plenamente con la Provincia de Corrientes."
        
    recomendaciones = [
        f"Revisar el link oficial ({convocatoria['link_oficial']}) para validar plazos de presentación.",
        f"Asegurar que el proyecto esté encuadrado bajo la temática: {convocatoria['tematica']}.",
        "Preparar la documentación contable y legal requerida para el tipo de destinatario indicado."
    ]
    
    return {
        "id": convocatoria["id"],
        "titulo": convocatoria["titulo"],
        "organismo": convocatoria["organismo"],
        "tematica": convocatoria["tematica"],
        "ambito": convocatoria["ambito"],
        "monto_maximo": convocatoria["monto_maximo"],
        "fecha_cierre": convocatoria["fecha_cierre"],
        "link_oficial": convocatoria["link_oficial"],
        "match_score": score,
        "match_analysis": analisis,
        "corrientes_eligibility": "Elegible" if es_elegible_corrientes else "Revisar Restricciones Geográficas",
        "recommendations": recomendaciones
    }


def _gemini_match(description: str, convocatorias: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Utiliza el LLM de Gemini para hacer un análisis de coincidencia semántica profundo y detallado.
    """
    model = genai.GenerativeModel(MODEL_NAME)
    
    prompt = f"""
    Eres un analista experto en financiamiento y subsidios de Argentina y organismos internacionales.
    Tu objetivo es evaluar el nivel de coincidencia y elegibilidad de un proyecto específico frente a una lista de convocatorias de financiamiento.
    
    PROYECTO A EVALUAR:
    \"\"\"{description}\"\"\"
    
    LISTA DE CONVOCATORIAS:
    {json.dumps(convocatorias, ensure_ascii=False, indent=2)}
    
    Para cada convocatoria, debes realizar un análisis y responder con un objeto JSON en formato de lista. Cada elemento de la lista debe tener exactamente esta estructura:
    [
      {{
        "id": "id_de_la_convocatoria",
        "match_score": 85, // Un entero de 0 a 100 indicando la afinidad.
        "match_analysis": "Explicación detallada en español de por qué coincide o no con el proyecto, mencionando áreas temáticas, tipo de organización (PyME vs Gobierno) y viabilidad para Corrientes.",
        "corrientes_eligibility": "Elegible / No Elegible / Requiere Alianza Regional (justificar brevemente)",
        "recommendations": [
          "Recomendación específica 1 para postularse con éxito a esta convocatoria.",
          "Recomendación específica 2..."
        ]
      }}
    ]
    
    Asegúrate de que tu respuesta contenga ÚNICAMENTE el código JSON válido, sin delimitadores ```json o texto adicional.
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Limpiar posibles delimitadores markdown
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        results = json.loads(text)
        
        # Mapear los resultados del LLM de vuelta a los datos de la convocatoria
        mapped_results = []
        conv_dict = {c["id"]: c for c in convocatorias}
        
        for res in results:
            cid = res.get("id")
            if cid in conv_dict:
                conv = conv_dict[cid]
                mapped_results.append({
                    **conv,
                    "match_score": res.get("match_score", 0),
                    "match_analysis": res.get("match_analysis", "No se generó análisis."),
                    "corrientes_eligibility": res.get("corrientes_eligibility", "Desconocido"),
                    "recommendations": res.get("recommendations", [])
                })
        return mapped_results
    except Exception as e:
        print(f"Error calling Gemini API: {e}. Falling back to heuristics.")
        # Fallback si falla el llamado o el parseo JSON
        return [_heuristic_match(description, c) for c in convocatorias]


def evaluate_matching(project_description: str, convocatorias: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Punto de entrada principal para evaluar las convocatorias contra el proyecto.
    Elige dinámicamente entre Gemini LLM y matching heurístico basado en la disponibilidad.
    """
    if not project_description.strip():
        # Si no hay descripción, devolver datos básicos con score 0
        return [{**c, "match_score": 0, "match_analysis": "Proporciona una descripción del proyecto para evaluar afinidad.", "corrientes_eligibility": "Pendiente", "recommendations": []} for c in convocatorias]
        
    if HAS_GEMINI:
        return _gemini_match(project_description, convocatorias)
    else:
        results = [_heuristic_match(project_description, c) for c in convocatorias]
        # Ordenar por mayor score primero
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results
