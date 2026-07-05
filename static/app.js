// ==========================================
// FinanCorrientes - Frontend Application Logic
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Application State
    const state = {
        convocatorias: [],
        evaluatedConvocatorias: [],
        webSearchConvocatorias: [],
        activeTab: "local-db", // 'local-db' | 'web-search'
        hasEvaluated: false,
        currentProjectDesc: "",
        filters: {
            search: "",
            tematica: "",
            ambito: ""
        }
    };

    // DOM Elements
    const elements = {
        convocatoriasList: document.getElementById("convocatoras-list"),
        tabLocalDb: document.querySelector('[data-tab="local-db"]'),
        tabWebSearch: document.querySelector('[data-tab="web-search"]'),
        localDbControls: document.getElementById("local-db-controls"),
        webSearchControls: document.getElementById("web-search-controls"),
        activeFiltersInfo: document.getElementById("active-filters-info"),
        filtersText: document.getElementById("filters-text"),
        btnClearFilters: document.getElementById("btn-clear-filters"),
        
        // Local DB Filter Controls
        dbSearchInput: document.getElementById("db-search-input"),
        filterTematica: document.getElementById("filter-tematica"),
        filterAmbito: document.getElementById("filter-ambito"),
        
        // Web Search Controls
        webSearchForm: document.getElementById("web-search-form"),
        webSearchInput: document.getElementById("web-search-input"),
        
        // AI Matcher Controls
        matcherForm: document.getElementById("matcher-form"),
        projectDescTextarea: document.getElementById("project-desc"),
        btnEvaluate: document.getElementById("btn-evaluate"),
        evaluationStatus: document.getElementById("evaluation-status"),
        verticalTags: document.querySelectorAll(".vertical-tag"),
        
        // Modal
        detailModal: document.getElementById("detail-modal"),
        modalDetailBody: document.getElementById("modal-detail-body"),
        btnCloseModal: document.getElementById("btn-close-modal")
    };

    // ==========================================
    // API Interactivity Functions
    // ==========================================

    /**
     * Carga las convocatorias iniciales desde el backend.
     */
    async function loadLocalConvocatorias() {
        showLoadingState("Cargando convocatorias oficiales...");
        try {
            const response = await fetch("/api/convocatorias");
            if (!response.ok) throw new Error("Error cargando convocatorias");
            
            state.convocatorias = await response.ok ? await response.json() : [];
            state.evaluatedConvocatorias = [];
            state.hasEvaluated = false;
            
            renderConvocatorias(state.convocatorias);
        } catch (error) {
            console.error(error);
            showErrorState("No se pudo conectar con el servidor. Revisa que el backend esté ejecutándose.");
        }
    }

    /**
     * Envía la descripción del proyecto para evaluar afinidad con IA.
     */
    async function evaluateProject(description) {
        showEvaluationLoading(true);
        try {
            const response = await fetch("/api/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ project_description: description })
            });

            if (!response.ok) throw new Error("Error en la evaluación del proyecto");

            const results = await response.json();
            state.evaluatedConvocatorias = results;
            state.hasEvaluated = true;
            state.currentProjectDesc = description;
            
            // Renderizar los resultados de coincidencia (ordenados automáticamente por score alto en backend)
            renderConvocatorias(results);
            
            // Actualizar tags del formulario basados en palabras clave detectadas en la descripción
            updateDetectedTags(description);
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error al procesar el proyecto. Por favor, intenta nuevamente.");
        } finally {
            showEvaluationLoading(false);
        }
    }

    /**
     * Realiza una búsqueda de financiamiento en la web en tiempo real.
     */
    async function searchWebFinancing(query) {
        showLoadingState(`Buscando en la web oportunidades sobre "${query}"...`);
        try {
            const response = await fetch(`/api/search-web?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error("Error en búsqueda web");

            let webResults = await response.json();
            
            // Opcional: Si ya hay un proyecto evaluado previamente, evaluar también estos nuevos resultados de la web
            if (state.hasEvaluated && state.currentProjectDesc) {
                // Hacemos una simulación local de scoring rápida para los resultados de la web para mantener consistencia
                webResults = webResults.map(item => {
                    const tempMatch = mockEvaluateSingle(state.currentProjectDesc, item);
                    return { ...item, ...tempMatch };
                });
                webResults.sort((a, b) => b.match_score - a.match_score);
            }
            
            state.webSearchConvocatorias = webResults;
            renderConvocatorias(webResults);
        } catch (error) {
            console.error(error);
            showErrorState("Error al realizar la búsqueda en tiempo real. Intente con otra consulta.");
        }
    }

    // ==========================================
    // UI Rendering Logic
    // ==========================================

    function showLoadingState(message) {
        elements.convocatoriasList.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    }

    function showErrorState(message) {
        elements.convocatoriasList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--rose);"></i>
                <p>${message}</p>
                <button class="btn btn-secondary" id="btn-retry-load" style="width: auto; margin-top: 1rem;">Reintentar</button>
            </div>
        `;
        const retryBtn = document.getElementById("btn-retry-load");
        if (retryBtn) retryBtn.addEventListener("click", loadLocalConvocatorias);
    }

    function showEvaluationLoading(isLoading) {
        if (isLoading) {
            elements.evaluationStatus.classList.remove("hidden");
            elements.btnEvaluate.setAttribute("disabled", "disabled");
            elements.btnEvaluate.querySelector("span").textContent = "Procesando...";
        } else {
            elements.evaluationStatus.classList.add("hidden");
            elements.btnEvaluate.removeAttribute("disabled");
            elements.btnEvaluate.querySelector("span").textContent = "Evaluar Compatibilidad";
        }
    }

    /**
     * Renderiza las tarjetas de convocatorias.
     */
    function renderConvocatorias(list) {
        elements.convocatoriasList.innerHTML = "";
        
        // Filtrar localmente si estamos en la pestaña DB local y no se ha evaluado con IA
        let filteredList = list;
        if (state.activeTab === "local-db" && !state.hasEvaluated) {
            filteredList = list.filter(item => {
                const matchSearch = !state.filters.search || 
                    item.titulo.toLowerCase().includes(state.filters.search.toLowerCase()) || 
                    item.organismo.toLowerCase().includes(state.filters.search.toLowerCase()) ||
                    item.descripcion.toLowerCase().includes(state.filters.search.toLowerCase());
                
                const matchTematica = !state.filters.tematica || 
                    item.tematica === state.filters.tematica;
                
                const matchAmbito = !state.filters.ambito || 
                    item.ambito.toLowerCase() === state.filters.ambito.toLowerCase();
                
                return matchSearch && matchTematica && matchAmbito;
            });
        }

        if (filteredList.length === 0) {
            elements.convocatoriasList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-circle-question" style="font-size: 2.5rem;"></i>
                    <p>No se encontraron convocatorias que coincidan con los filtros seleccionados.</p>
                </div>
            `;
            return;
        }

        filteredList.forEach(item => {
            const card = document.createElement("div");
            card.className = "funding-card";
            
            // Determinar color de temática para tag visual
            let themeClass = item.tematica;
            
            // Generar porcentaje de coincidencia si está evaluado
            const showScore = state.hasEvaluated && item.match_score !== undefined;
            const scorePercent = showScore ? item.match_score : 0;
            
            card.innerHTML = `
                <div class="card-header-row">
                    <div class="card-title-group">
                        <h3>${escapeHTML(item.titulo)}</h3>
                        <p class="card-organismo">${escapeHTML(item.organismo)}</p>
                    </div>
                    ${showScore ? `<span class="badge badge-match">${scorePercent}% Match</span>` : ''}
                </div>
                
                <div class="badge-group">
                    <span class="badge badge-tematica" data-theme="${themeClass}">${escapeHTML(item.tematica)}</span>
                    <span class="badge badge-ambito">${escapeHTML(item.ambito)}</span>
                </div>
                
                <p class="card-excerpt" style="font-size: 0.85rem; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height: 1.5;">
                    ${escapeHTML(item.descripcion)}
                </p>
                
                <div class="card-footer">
                    <div class="card-footer-item">
                        <i class="fa-solid fa-sack-dollar"></i>
                        <span>${escapeHTML(item.monto_maximo)}</span>
                    </div>
                    <div class="card-footer-item">
                        <i class="fa-solid fa-calendar-xmark"></i>
                        <span>Cierre: ${escapeHTML(item.fecha_cierre)}</span>
                    </div>
                </div>

                ${showScore ? `
                <div class="match-meter">
                    <div class="match-fill" style="width: ${scorePercent}%"></div>
                </div>` : ''}
            `;
            
            card.addEventListener("click", () => openDetailModal(item));
            elements.convocatoriasList.appendChild(card);
        });
    }

    /**
     * Muestra los detalles de una convocatoria en un modal de glassmorphic.
     */
    function openDetailModal(item) {
        const hasScore = state.hasEvaluated && item.match_score !== undefined;
        
        // Crear cuerpo del modal
        let modalHTML = `
            <div class="modal-detail-header">
                <h2>${escapeHTML(item.titulo)}</h2>
                <p class="modal-detail-organismo"><i class="fa-solid fa-building"></i> ${escapeHTML(item.organismo)}</p>
            </div>
        `;

        // Si hay evaluación de IA activa, mostrar reporte de matching arriba
        if (hasScore) {
            const eligibilityClass = item.corrientes_eligibility && item.corrientes_eligibility.toLowerCase().includes("elegible") ? "elegible" : "revisar";
            
            modalHTML += `
                <div class="ai-match-report">
                    <div class="ai-report-title">
                        <h4><i class="fa-solid fa-wand-magic-sparkles"></i> Análisis de Compatibilidad IA</h4>
                        <span class="eligibility-status-badge ${eligibilityClass}">${escapeHTML(item.corrientes_eligibility)}</span>
                    </div>
                    <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); margin-bottom: 1rem;">
                        <strong>Análisis:</strong> ${escapeHTML(item.match_analysis)}
                    </p>
                    
                    <h5 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--cyan); margin-bottom: 0.5rem;">
                        Recomendaciones para Aplicar:
                    </h5>
                    <ul class="ai-recommendations-list">
                        ${item.recommendations ? item.recommendations.map(rec => `<li>${escapeHTML(rec)}</li>`).join("") : '<li>Revisar detenidamente las bases oficiales.</li>'}
                    </ul>
                </div>
            `;
        }

        // Secciones básicas
        modalHTML += `
            <div class="modal-section">
                <h3>Descripción del Programa</h3>
                <p>${escapeHTML(item.descripcion)}</p>
            </div>
            
            <div class="modal-section">
                <h3>Requisitos Básicos</h3>
                <ul class="requirements-list">
                    ${item.requisitos ? item.requisitos.map(req => `<li>${escapeHTML(req)}</li>`).join("") : '<li>Presentar documentación del proyecto y personería jurídica.</li>'}
                </ul>
            </div>

            <div class="verticals-tags" style="margin-top: 1.5rem; margin-bottom: 1.5rem;">
                <div class="vertical-tag active"><i class="fa-solid fa-layer-group"></i> Ámbito: ${escapeHTML(item.ambito)}</div>
                <div class="vertical-tag active"><i class="fa-solid fa-users"></i> Destinatarios: ${escapeHTML(item.destinatarios.join(", "))}</div>
            </div>

            <div class="modal-footer">
                <div class="card-footer-item" style="font-size: 1rem; font-weight: 600;">
                    <i class="fa-solid fa-money-bill-wave" style="color: var(--teal); font-size: 1.2rem;"></i>
                    <span>Financiamiento Máximo: ${escapeHTML(item.monto_maximo)}</span>
                </div>
                <div class="card-footer-item" style="font-size: 1rem; font-weight: 600; margin-left: auto;">
                    <i class="fa-solid fa-hourglass-half" style="color: var(--amber); font-size: 1.2rem;"></i>
                    <span>Fecha Límite: ${escapeHTML(item.fecha_cierre)}</span>
                </div>
            </div>
            
            <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                <a href="${escapeHTML(item.link_oficial)}" target="_blank" class="btn btn-primary" style="text-decoration: none; flex: 1;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Ir a la Web Oficial de Convocatoria
                </a>
            </div>
        `;

        elements.modalDetailBody.innerHTML = modalHTML;
        elements.detailModal.classList.remove("hidden");
    }

    // ==========================================
    // Helper & Fallback Functions
    // ==========================================

    /**
     * Escapa caracteres HTML para evitar XSS.
     */
    function escapeHTML(str) {
        if (!str) return "";
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Detección de tags temáticos activa para el formulario según palabras clave.
     */
    function updateDetectedTags(description) {
        const text = description.lowerCase ? description.toLowerCase() : description;
        
        const keywords = {
            modernizacion: ["modernizacion", "estado", "público", "gobierno", "trámite", "municip", "catastro"],
            datos: ["datos", "data", "ciencia", "analitica", "analytics", "predictiv", "big data"],
            ia: ["ia", "ai", "artificial", "inteligencia", "machine learning", "aprendizaje", "algoritmo"],
            carbono: ["carbono", "huella", "co2", "emision", "verde", "sostenible", "ambiental", "eficiencia"]
        };

        elements.verticalTags.forEach(tag => {
            const vertical = tag.getAttribute("data-vertical");
            const matches = keywords[vertical].some(kw => text.includes(kw));
            if (matches) {
                tag.classList.add("active");
            } else {
                tag.classList.remove("active");
            }
        });
    }

    /**
     * Evaluación de matching simple offline de un único item para resultados web.
     */
    function mockEvaluateSingle(projectDesc, item) {
        const descLower = projectDesc.toLowerCase();
        const titleLower = item.titulo.toLowerCase();
        const bodyLower = item.descripcion.toLowerCase();
        
        let score = 25;
        let hits = 0;
        
        // Evaluar compatibilidad temática
        const keywords = {
            "Modernizacion del Estado": ["estado", "público", "digitalización", "modernización", "trámite"],
            "Ciencia de Datos": ["datos", "data", "analítica", "predictivo", "estadística"],
            "Inteligencia Artificial": ["ia", "ai", "artificial", "machine learning", "algoritmo"],
            "Huella de Carbono": ["carbono", "huella", "emisión", "ambiental", "verde", "clima"]
        };

        const targetKeywords = keywords[item.tematica] || [];
        targetKeywords.forEach(kw => {
            if (descLower.includes(kw)) {
                hits++;
                score += 8;
            }
        });
        
        // regional corrientes
        const isCorrientes = descLower.includes("corrientes") || descLower.includes("litoral");
        if (isCorrientes) {
            score += 15;
        }
        
        score = Math.min(score, 95);
        
        return {
            match_score: score,
            match_analysis: `Evaluado de forma simplificada: Alta coincidencia temática en ${item.tematica}. Enlace web externo.`,
            corrientes_eligibility: "Compatible Regional",
            recommendations: ["Validar en el sitio web si hay cupo para la provincia de Corrientes.", "Contactar al gestor del programa."]
        };
    }

    // ==========================================
    // Event Listeners
    // ==========================================

    // Tabs Navigation
    elements.tabLocalDb.addEventListener("click", () => {
        elements.tabLocalDb.classList.add("active");
        elements.tabWebSearch.classList.remove("active");
        elements.localDbControls.classList.remove("hidden");
        elements.webSearchControls.classList.add("hidden");
        state.activeTab = "local-db";
        
        // Renderizar base de datos original o evaluada
        renderConvocatorias(state.hasEvaluated ? state.evaluatedConvocatorias : state.convocatorias);
    });

    elements.tabWebSearch.addEventListener("click", () => {
        elements.tabWebSearch.classList.add("active");
        elements.tabLocalDb.classList.remove("active");
        elements.webSearchControls.classList.remove("hidden");
        elements.localDbControls.classList.add("hidden");
        state.activeTab = "web-search";
        
        // Renderizar resultados web
        if (state.webSearchConvocatorias.length > 0) {
            renderConvocatorias(state.webSearchConvocatorias);
        } else {
            elements.convocatoriasList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-earth-americas" style="font-size: 2.5rem; color: var(--indigo);"></i>
                    <p>Ingresa términos de búsqueda para escanear oportunidades financieras en la web en tiempo real.</p>
                </div>
            `;
        }
    });

    // Filtros Locales (Búsqueda por texto y selectors)
    const handleFiltersChange = () => {
        state.filters.search = elements.dbSearchInput.value;
        state.filters.tematica = elements.filterTematica.value;
        state.filters.ambito = elements.filterAmbito.value;

        // Mostrar indicador de filtros activos si hay alguno
        if (state.filters.search || state.filters.tematica || state.filters.ambito) {
            elements.activeFiltersInfo.classList.remove("hidden");
            elements.filtersText.textContent = `Filtros activos: ${[
                state.filters.search ? `"${state.filters.search}"` : null,
                state.filters.tematica,
                state.filters.ambito
            ].filter(Boolean).join(" | ")}`;
        } else {
            elements.activeFiltersInfo.classList.add("hidden");
        }

        renderConvocatorias(state.convocatorias);
    };

    elements.dbSearchInput.addEventListener("input", handleFiltersChange);
    elements.filterTematica.addEventListener("change", handleFiltersChange);
    elements.filterAmbito.addEventListener("change", handleFiltersChange);

    // Limpiar Filtros
    elements.btnClearFilters.addEventListener("click", () => {
        elements.dbSearchInput.value = "";
        elements.filterTematica.value = "";
        elements.filterAmbito.value = "";
        elements.activeFiltersInfo.classList.add("hidden");
        
        state.filters.search = "";
        state.filters.tematica = "";
        state.filters.ambito = "";
        
        renderConvocatorias(state.hasEvaluated ? state.evaluatedConvocatorias : state.convocatorias);
    });

    // Formulario de Evaluación IA
    elements.matcherForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const desc = elements.projectDescTextarea.value.trim();
        if (desc.length < 30) {
            alert("Por favor, ingresa una descripción más detallada del proyecto (mínimo 30 caracteres) para obtener un análisis de calidad.");
            return;
        }
        evaluateProject(desc);
    });

    // Formulario de Búsqueda Web
    elements.webSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = elements.webSearchInput.value.trim();
        if (query) {
            searchWebFinancing(query);
        }
    });

    // Modal Close Events
    elements.btnCloseModal.addEventListener("click", () => {
        elements.detailModal.classList.add("hidden");
    });

    elements.detailModal.addEventListener("click", (e) => {
        if (e.target === elements.detailModal) {
            elements.detailModal.classList.add("hidden");
        }
    });

    // Inicializar cargando convocatorias
    loadLocalConvocatorias();
});
