# FinanCorrientes - Buscador Inteligente de Financiamiento

Este es un proyecto diseñado para facilitar la búsqueda, filtrado y evaluación de oportunidades de financiamiento y subsidios nacionales e internacionales aplicables a PyMEs, empresas y entes públicos de la **Provincia de Corrientes**, en Argentina.

La plataforma se especializa en convocatorias vigentes enfocadas en:
1. **Modernización del Estado**
2. **Ciencia de Datos**
3. **Inteligencia Artificial**
4. **Huella de Carbono**

---

## Características de la Plataforma

*   **Evaluador Inteligente (IA):** Analiza la descripción semántica de un proyecto y calcula la afinidad y compatibilidad geográfica/técnica con las convocatorias, proporcionando recomendaciones personalizadas para la postulación.
*   **Buscador en Tiempo Real:** Módulo integrado que busca en la web de forma activa nuevas oportunidades de financiamiento.
*   **Diseño Premium:** Interfaz oscura moderna y responsive, optimizada con efectos de Glassmorphism y animaciones de interacción fluidas.

---

## Estructura del Proyecto

*   `main.py`: Punto de entrada del servidor FastAPI. Servidor web y API.
*   `requirements.txt`: Dependencias del backend de Python.
*   `Dockerfile`: Configuración del contenedor para despliegue en Google Cloud.
*   `data/convocatorias.json`: Base de datos local precargada con convocatorias del CFI, BID, CAF, Unión Europea y provinciales vigentes para 2026.
*   `src/matching.py`: Lógica de emparejamiento con IA (utilizando Gemini API o heurísticas avanzadas de respaldo).
*   `src/scraper.py`: Web scraper en tiempo real utilizando DuckDuckGo HTML.
*   `static/`: Contiene los archivos estáticos de la interfaz frontend (HTML, CSS y JS).

---

## Cómo Ejecutar Localmente

1.  Asegúrate de estar en el directorio raíz del proyecto.
2.  Crea e instala el entorno virtual:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    ```
3.  *(Opcional)* Si quieres utilizar el análisis profundo de IA, configura tu clave API de Gemini:
    ```bash
    export GEMINI_API_KEY="tu_clave_api_aquí"
    ```
4.  Inicia la aplicación:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
5.  Abre en tu navegador: [http://127.0.0.1:8000](http://127.0.0.1:8000)

---

## Cómo Vincular y Subir a GitHub

El proyecto ya cuenta con el repositorio local inicializado y el primer commit realizado. Para subirlo a tu cuenta de GitHub:

1.  Crea un nuevo repositorio vacío en tu GitHub con el nombre `Analisis-Financiamiento` (no agregues README ni archivo de licencia).
2.  Copia la URL del repositorio creado y ejecuta en tu consola:
    ```bash
    git remote add origin <URL_DE_TU_REPOSITORIO_DE_GITHUB>
    git branch -M main
    git push -u origin main
    ```

---

## Despliegue en Google Cloud Run

Este proyecto está configurado para ejecutarse en contenedores en Google Cloud. Para desplegar actualizaciones de forma manual:

```bash
gcloud run deploy financiamiento-corrientes --source . --region us-central1 --allow-unauthenticated
```
