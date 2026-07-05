// ==========================================
// FinanCorrientes - Frontend Application Logic
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Application State
    const state = {
        convocatorias: [],
        evaluatedConvocatorias: [],
        webSearchConvocatorias: [],
        noticias: [],
        activeTab: "local-db", // 'local-db' | 'web-search' | 'news-feed'
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
        tabNewsFeed: document.querySelector('[data-tab="news-feed"]'),
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
     * Carga las noticias y novedades productivas desde el backend y las muestra.
     */
    async function loadNoticias() {
        showLoadingState("Cargando novedades e inversiones en Corrientes...");
        try {
            const response = await fetch("/api/noticias");
            if (!response.ok) throw new Error("Error cargando noticias");
            
            const noticias = await response.json();
            state.noticias = noticias;
            
            renderNoticias(noticias);
        } catch (error) {
            console.error(error);
            showErrorState("No se pudieron cargar las noticias de inversión provincial.");
        }
    }

    /**
     * Renderiza las tarjetas de noticias de forma interactiva.
     */
    function renderNoticias(list) {
        elements.convocatoriasList.innerHTML = "";
        
        if (list.length === 0) {
            elements.convocatoriasList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-newspaper" style="font-size: 2.5rem;"></i>
                    <p>No hay noticias cargadas en este momento.</p>
                </div>
            `;
            return;
        }

        list.forEach(item => {
            const card = document.createElement("div");
            card.className = "funding-card";
            card.style.borderColor = "rgba(168, 85, 247, 0.15)";
            
            card.innerHTML = `
                <div class="card-header-row">
                    <div class="card-title-group">
                        <span style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--cyan); letter-spacing: 0.5px;">Novedad Productiva / Inversión</span>
                        <h3 style="margin-top: 0.3rem; font-size: 1.15rem;">${escapeHTML(item.titulo)}</h3>
                        <p class="card-organismo"><i class="fa-solid fa-receipt"></i> Fuente: ${escapeHTML(item.organismo_fuente)}</p>
                    </div>
                </div>
                
                <div class="badge-group">
                    <span class="badge badge-tematica" data-theme="${item.sector}">${escapeHTML(item.sector)}</span>
                    <span class="badge badge-ambito" style="background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); color: var(--emerald);">Impacto Corrientes</span>
                </div>
                
                <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHTML(item.resumen)}
                </p>
                
                <div style="background: rgba(14, 165, 233, 0.04); border: 1px solid rgba(14, 165, 233, 0.1); border-radius: 10px; padding: 0.8rem; font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary);">
                    <strong>¿Por qué importa a Corrientes?:</strong> ${escapeHTML(item.impacto_corrientes)}
                </div>
                
                <div class="card-footer">
                    <div class="card-footer-item">
                        <i class="fa-solid fa-calendar-days"></i>
                        <span>Publicado: ${escapeHTML(item.fecha)}</span>
                    </div>
                </div>
            `;
            
            card.addEventListener("click", () => {
                const modalHTML = `
                    <div class="modal-detail-header">
                        <span style="font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--cyan); letter-spacing: 0.5px;">Novedad de Inversión y Competitividad</span>
                        <h2 style="margin-top: 0.4rem;">${escapeHTML(item.titulo)}</h2>
                        <p class="modal-detail-organismo"><i class="fa-solid fa-rss"></i> Fuente Oficial: ${escapeHTML(item.organismo_fuente)}</p>
                    </div>
                    
                    <div class="modal-section">
                        <h3>Detalle de la Novedad</h3>
                        <p style="font-size: 1rem; line-height: 1.6; color: var(--text-secondary);">${escapeHTML(item.resumen)}</p>
                    </div>
                    
                    <div class="modal-section" style="background: rgba(14, 165, 233, 0.05); border: 1px solid rgba(14, 165, 233, 0.2); border-radius: 12px; padding: 1.2rem; margin-top: 1.5rem; margin-bottom: 1.5rem;">
                        <h3 style="color: var(--cyan); margin-bottom: 0.5rem;"><i class="fa-solid fa-chart-line"></i> Impacto Directo en la Provincia de Corrientes</h3>
                        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); font-weight: 500;">
                            ${escapeHTML(item.impacto_corrientes)}
                        </p>
                    </div>
                    
                    <div class="verticals-tags" style="margin-top: 1.5rem; margin-bottom: 1.5rem;">
                        <div class="vertical-tag active"><i class="fa-solid fa-tree"></i> Sector: ${escapeHTML(item.sector)}</div>
                        <div class="vertical-tag active"><i class="fa-solid fa-calendar-check"></i> Fecha: ${escapeHTML(item.fecha)}</div>
                    </div>
                    
                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <a href="${escapeHTML(item.link_oficial)}" target="_blank" class="btn btn-primary" style="text-decoration: none; flex: 1;">
                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                            Ver Comunicado / Noticia Completa
                        </a>
                    </div>
                `;
                elements.modalDetailBody.innerHTML = modalHTML;
                elements.detailModal.classList.remove("hidden");
            });
            
            elements.convocatoriasList.appendChild(card);
        });
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

            ${item.como_aplicar ? `
            <div class="modal-section" style="background: rgba(20, 184, 166, 0.05); border: 1px solid rgba(20, 184, 166, 0.2); border-radius: 12px; padding: 1.2rem; margin-top: 1.5rem; margin-bottom: 1.5rem;">
                <h3 style="color: var(--teal); margin-bottom: 0.5rem; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.5px;"><i class="fa-solid fa-circle-info"></i> ¿Cómo Iniciar la Postulación?</h3>
                <p style="white-space: pre-line; font-size: 0.95rem; line-height: 1.6; color: var(--text-primary); font-weight: 500;">
                    ${escapeHTML(item.como_aplicar)}
                </p>
            </div>
            ` : ''}

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
            
            ${item.fuentes ? `
            <div class="modal-section" style="margin-top: 1.5rem; border-top: 1px solid var(--panel-border); padding-top: 1.5rem;">
                <h3>Fuentes y Enlaces Oficiales</h3>
                
                <!-- Fuentes Directas -->
                ${item.fuentes.some(f => f.tipo === 'Directa') ? `
                <h4 style="font-size: 0.9rem; color: var(--teal); margin-top: 0.8rem; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
                    <i class="fa-solid fa-circle-arrow-right"></i> Fuentes Directas (Bases, Formularios e Inscripciones)
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.2rem; padding-left: 0.2rem;">
                    ${item.fuentes.filter(f => f.tipo === 'Directa').map(f => `
                        <div style="font-size: 0.9rem; display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap;">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--teal); background: rgba(20, 184, 166, 0.1); padding: 0.15rem 0.4rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px;">
                                ${escapeHTML(f.categoria)}
                            </span>
                            <a href="${escapeHTML(f.url)}" target="_blank" style="color: var(--text-secondary); text-decoration: none; border-bottom: 1px dashed var(--text-muted); padding-bottom: 1px; transition: var(--transition-smooth); display: inline-flex; align-items: center; gap: 0.3rem;">
                                ${escapeHTML(f.nombre)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; color: var(--text-muted);"></i>
                            </a>
                        </div>
                    `).join("")}
                </div>
                ` : ''}

                <!-- Fuentes Generales -->
                ${item.fuentes.some(f => f.tipo === 'General') ? `
                <h4 style="font-size: 0.9rem; color: var(--indigo); margin-top: 0.8rem; margin-bottom: 0.6rem; display: flex; align-items: center; gap: 0.4rem;">
                    <i class="fa-solid fa-globe"></i> Fuentes Generales (Portales Institucionales)
                </h4>
                <div style="display: flex; flex-direction: column; gap: 0.8rem; padding-left: 0.2rem;">
                    ${item.fuentes.filter(f => f.tipo === 'General').map(f => `
                        <div style="font-size: 0.9rem; display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap;">
                            <span style="font-size: 0.7rem; font-weight: 700; color: var(--indigo); background: rgba(99, 102, 241, 0.1); padding: 0.15rem 0.4rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px;">
                                ${escapeHTML(f.categoria)}
                            </span>
                            <a href="${escapeHTML(f.url)}" target="_blank" style="color: var(--text-secondary); text-decoration: none; border-bottom: 1px dashed var(--text-muted); padding-bottom: 1px; display: inline-flex; align-items: center; gap: 0.3rem;">
                                ${escapeHTML(f.nombre)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem; color: var(--text-muted);"></i>
                            </a>
                        </div>
                    `).join("")}
                </div>
                ` : ''}
            </div>
            ` : ''}

            <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                <a href="${escapeHTML(item.link_oficial)}" target="_blank" class="btn btn-primary" style="text-decoration: none; flex: 1;">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    Ir a la Web Oficial Principal
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
            "Huella de Carbono": ["carbono", "huella", "emisión", "ambiental", "verde", "clima"],
            "Forestoindustria": ["forestoindustria", "forestal", "madera", "aserradero", "celulosa", "pino", "maderero", "biomasa"],
            "Sector Primario": ["agrícola", "ganadero", "ganadería", "agricultura", "riego", "campo", "agro", "productor", "arroz"],
            "Infraestructura Vial": ["ruta", "vial", "camino", "transporte", "logística", "pavimento", "concesión", "asfalto"]
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
        elements.tabNewsFeed.classList.remove("active");
        elements.localDbControls.classList.remove("hidden");
        elements.webSearchControls.classList.add("hidden");
        state.activeTab = "local-db";
        
        // Renderizar base de datos original o evaluada
        renderConvocatorias(state.hasEvaluated ? state.evaluatedConvocatorias : state.convocatorias);
    });

    elements.tabWebSearch.addEventListener("click", () => {
        elements.tabWebSearch.classList.add("active");
        elements.tabLocalDb.classList.remove("active");
        elements.tabNewsFeed.classList.remove("active");
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

    elements.tabNewsFeed.addEventListener("click", () => {
        elements.tabNewsFeed.classList.add("active");
        elements.tabLocalDb.classList.remove("active");
        elements.tabWebSearch.classList.remove("active");
        elements.localDbControls.classList.add("hidden");
        elements.webSearchControls.classList.add("hidden");
        state.activeTab = "news-feed";
        
        loadNoticias();
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
