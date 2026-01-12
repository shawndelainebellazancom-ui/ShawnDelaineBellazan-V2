/**
 * PMCR-O STATE MANAGEMENT SYSTEM v1.1
 * Enterprise-grade state management for Meta-Orchestrator
 */

class PMCRStateManager {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.state = {
            current_cycle: null,
            phase_history: [],
            artifact_registry: new Map(),
            validation_state: new Map(),
            cognitive_memory: new Map(),
            performance_metrics: new Map()
        };

        // Persistence settings
        this.persistence = {
            enabled: true,
            storage_key: 'pmcro_state_v1_1',
            auto_save_interval: 30000, // 30 seconds
            max_history_entries: 1000
        };

        // Initialize state management
        this.initializeStateManagement();
    }

    // Initialize state management components
    initializeStateManagement() {
        this.loadPersistedState();
        this.startAutoSave();
        this.orchestrator.log('INFO', 'State management system initialized', {
            persistence_enabled: this.persistence.enabled,
            auto_save_interval: this.persistence.auto_save_interval
        });
    }

    // Core state operations
    getCurrentState() {
        return {
            ...this.state,
            timestamp: new Date().toISOString(),
            orchestrator_status: this.orchestrator.getCurrentPhase()
        };
    }

    updateState(updates) {
        const previousState = { ...this.state };

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (this.state.hasOwnProperty(key)) {
                if (updates[key] instanceof Map) {
                    this.state[key] = new Map([...this.state[key], ...updates[key]]);
                } else {
                    this.state[key] = updates[key];
                }
            }
        });

        // Log state change
        this.orchestrator.log('DEBUG', 'State updated', {
            changes: Object.keys(updates),
            previous_cycle: previousState.current_cycle,
            new_cycle: this.state.current_cycle
        });

        // Trigger auto-save
        this.saveState();
    }

    // Cycle management
    startCycle(cycleType, context = {}) {
        const cycle = {
            id: `cycle_${cycleType}_${Date.now()}`,
            type: cycleType,
            start_time: new Date().toISOString(),
            end_time: null,
            phases: [],
            context,
            status: 'active',
            artifacts: [],
            validation_results: null
        };

        this.state.current_cycle = cycle;
        this.state.phase_history = []; // Reset phase history for new cycle

        this.orchestrator.log('INFO', `Cycle started: ${cycleType}`, {
            cycle_id: cycle.id,
            context_keys: Object.keys(context)
        });

        return cycle;
    }

    endCycle(success = true, results = {}) {
        if (!this.state.current_cycle) {
            this.orchestrator.log('WARN', 'No active cycle to end');
            return null;
        }

        const cycle = this.state.current_cycle;
        cycle.end_time = new Date().toISOString();
        cycle.status = success ? 'completed' : 'failed';
        cycle.results = results;

        // Archive cycle
        this.archiveCycle(cycle);

        // Reset current cycle
        this.state.current_cycle = null;

        this.orchestrator.log('INFO', `Cycle ended: ${cycle.type}`, {
            cycle_id: cycle.id,
            duration: new Date(cycle.end_time) - new Date(cycle.start_time),
            success,
            results_summary: Object.keys(results)
        });

        return cycle;
    }

    // Phase management within cycles
    startPhase(phaseName, context = {}) {
        if (!this.state.current_cycle) {
            this.orchestrator.log('WARN', 'No active cycle for phase start');
            return null;
        }

        const phase = {
            id: `phase_${phaseName}_${Date.now()}`,
            name: phaseName,
            start_time: new Date().toISOString(),
            end_time: null,
            context,
            status: 'active',
            artifacts: [],
            validation_results: null
        };

        this.state.current_cycle.phases.push(phase);
        this.state.phase_history.push(phase);

        // Maintain history limit
        if (this.state.phase_history.length > this.persistence.max_history_entries) {
            this.state.phase_history.shift();
        }

        this.orchestrator.log('INFO', `Phase started: ${phaseName}`, {
            phase_id: phase.id,
            cycle_id: this.state.current_cycle.id,
            context_keys: Object.keys(context)
        });

        return phase;
    }

    endPhase(phaseName, success = true, results = {}) {
        const phase = this.getCurrentPhase();
        if (!phase || phase.name !== phaseName) {
            this.orchestrator.log('WARN', `Phase mismatch or no active phase: expected ${phaseName}, got ${phase?.name}`);
            return null;
        }

        phase.end_time = new Date().toISOString();
        phase.status = success ? 'completed' : 'failed';
        phase.results = results;

        this.orchestrator.log('INFO', `Phase ended: ${phaseName}`, {
            phase_id: phase.id,
            duration: phase.end_time ? new Date(phase.end_time) - new Date(phase.start_time) : 0,
            success,
            artifacts_count: phase.artifacts.length
        });

        return phase;
    }

    getCurrentPhase() {
        return this.state.phase_history[this.state.phase_history.length - 1] || null;
    }

    // Artifact management
    registerArtifact(artifact) {
        const artifactId = artifact.id || `artifact_${Date.now()}`;
        this.state.artifact_registry.set(artifactId, {
            ...artifact,
            registered_at: new Date().toISOString(),
            phase: this.getCurrentPhase()?.name || 'unknown'
        });

        // Add to current phase if exists
        const currentPhase = this.getCurrentPhase();
        if (currentPhase) {
            currentPhase.artifacts.push(artifactId);
        }

        // Add to current cycle if exists
        if (this.state.current_cycle) {
            this.state.current_cycle.artifacts.push(artifactId);
        }

        this.orchestrator.log('DEBUG', `Artifact registered: ${artifactId}`, {
            type: artifact.type,
            phase: currentPhase?.name,
            size: JSON.stringify(artifact).length
        });

        return artifactId;
    }

    getArtifact(artifactId) {
        return this.state.artifact_registry.get(artifactId);
    }

    listArtifacts(phase = null, type = null) {
        const artifacts = Array.from(this.state.artifact_registry.values());

        return artifacts.filter(artifact => {
            if (phase && artifact.phase !== phase) return false;
            if (type && artifact.type !== type) return false;
            return true;
        });
    }

    // Validation state management
    updateValidationState(validationKey, results) {
        this.state.validation_state.set(validationKey, {
            ...results,
            timestamp: new Date().toISOString(),
            phase: this.getCurrentPhase()?.name || 'unknown'
        });

        this.orchestrator.log('DEBUG', `Validation state updated: ${validationKey}`, {
            passed: results.passed,
            phase: this.getCurrentPhase()?.name
        });
    }

    getValidationState(validationKey) {
        return this.state.validation_state.get(validationKey);
    }

    // Cognitive memory management
    storeCognitivePattern(pattern) {
        const patternId = `pattern_${Date.now()}`;
        this.state.cognitive_memory.set(patternId, {
            ...pattern,
            stored_at: new Date().toISOString(),
            phase: this.getCurrentPhase()?.name || 'unknown'
        });

        this.orchestrator.log('DEBUG', `Cognitive pattern stored: ${patternId}`, {
            type: pattern.type,
            confidence: pattern.confidence
        });

        return patternId;
    }

    retrieveCognitivePatterns(type = null, minConfidence = 0) {
        const patterns = Array.from(this.state.cognitive_memory.values());

        return patterns.filter(pattern => {
            if (type && pattern.type !== type) return false;
            if (pattern.confidence < minConfidence) return false;
            return true;
        });
    }

    // Performance metrics
    recordMetric(metricName, value, metadata = {}) {
        const metric = {
            name: metricName,
            value,
            timestamp: new Date().toISOString(),
            phase: this.getCurrentPhase()?.name || 'unknown',
            metadata
        };

        if (!this.state.performance_metrics.has(metricName)) {
            this.state.performance_metrics.set(metricName, []);
        }

        this.state.performance_metrics.get(metricName).push(metric);

        // Keep only last 100 entries per metric
        const metrics = this.state.performance_metrics.get(metricName);
        if (metrics.length > 100) {
            metrics.splice(0, metrics.length - 100);
        }

        this.orchestrator.log('DEBUG', `Performance metric recorded: ${metricName}`, {
            value,
            phase: this.getCurrentPhase()?.name
        });
    }

    getMetrics(metricName, timeRange = null) {
        const metrics = this.state.performance_metrics.get(metricName) || [];

        if (!timeRange) return metrics;

        const now = new Date();
        const rangeStart = new Date(now.getTime() - timeRange);

        return metrics.filter(metric =>
            new Date(metric.timestamp) >= rangeStart
        );
    }

    // Persistence operations
    saveState() {
        if (!this.persistence.enabled) return;

        try {
            const stateToSave = {
                ...this.state,
                // Convert Maps to objects for JSON serialization
                artifact_registry: Object.fromEntries(this.state.artifact_registry),
                validation_state: Object.fromEntries(this.state.validation_state),
                cognitive_memory: Object.fromEntries(this.state.cognitive_memory),
                performance_metrics: Object.fromEntries(this.state.performance_metrics),
                saved_at: new Date().toISOString()
            };

            // Use localStorage if available (browser), otherwise file system
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.persistence.storage_key, JSON.stringify(stateToSave));
            } else if (typeof require !== 'undefined') {
                // Node.js environment
                const fs = require('fs');
                const path = require('path');
                const stateFile = path.join(process.cwd(), `${this.persistence.storage_key}.json`);
                fs.writeFileSync(stateFile, JSON.stringify(stateToSave, null, 2));
            }

            this.orchestrator.log('DEBUG', 'State persisted successfully');
        } catch (error) {
            this.orchestrator.log('ERROR', 'Failed to persist state', { error: error.message });
        }
    }

    loadPersistedState() {
        if (!this.persistence.enabled) return;

        try {
            let persistedState = null;

            if (typeof localStorage !== 'undefined') {
                const stored = localStorage.getItem(this.persistence.storage_key);
                if (stored) persistedState = JSON.parse(stored);
            } else if (typeof require !== 'undefined') {
                const fs = require('fs');
                const path = require('path');
                const stateFile = path.join(process.cwd(), `${this.persistence.storage_key}.json`);
                if (fs.existsSync(stateFile)) {
                    persistedState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
                }
            }

            if (persistedState) {
                // Restore Maps from objects
                this.state = {
                    ...persistedState,
                    artifact_registry: new Map(Object.entries(persistedState.artifact_registry || {})),
                    validation_state: new Map(Object.entries(persistedState.validation_state || {})),
                    cognitive_memory: new Map(Object.entries(persistedState.cognitive_memory || {})),
                    performance_metrics: new Map(Object.entries(persistedState.performance_metrics || {}))
                };

                this.orchestrator.log('INFO', 'Persisted state loaded successfully', {
                    artifacts_count: this.state.artifact_registry.size,
                    phases_count: this.state.phase_history.length
                });
            }
        } catch (error) {
            this.orchestrator.log('WARN', 'Failed to load persisted state', { error: error.message });
        }
    }

    startAutoSave() {
        if (!this.persistence.enabled || this.persistence.auto_save_interval <= 0) return;

        setInterval(() => {
            this.saveState();
        }, this.persistence.auto_save_interval);
    }

    // Archive completed cycles
    archiveCycle(cycle) {
        // In a full implementation, this would save to a database or file system
        // For now, we'll just log the completion
        this.orchestrator.log('INFO', 'Cycle archived', {
            cycle_id: cycle.id,
            type: cycle.type,
            phases_completed: cycle.phases.length,
            artifacts_generated: cycle.artifacts.length
        });
    }

    // State analysis and reporting
    generateStateReport() {
        const report = {
            summary: {
                current_cycle: this.state.current_cycle?.id || null,
                total_phases: this.state.phase_history.length,
                total_artifacts: this.state.artifact_registry.size,
                total_patterns: this.state.cognitive_memory.size,
                generated_at: new Date().toISOString()
            },
            cycles: {
                active: this.state.current_cycle,
                recent_phases: this.state.phase_history.slice(-5)
            },
            performance: {
                metrics_count: this.state.performance_metrics.size,
                recent_metrics: this.getMetricsSummary()
            },
            validation: {
                checks_count: this.state.validation_state.size,
                recent_validations: Array.from(this.state.validation_state.values()).slice(-5)
            }
        };

        return report;
    }

    getMetricsSummary() {
        const summary = {};
        for (const [metricName, metrics] of this.state.performance_metrics) {
            if (metrics.length > 0) {
                const values = metrics.map(m => m.value);
                summary[metricName] = {
                    count: metrics.length,
                    average: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    latest: values[values.length - 1]
                };
            }
        }
        return summary;
    }

    // Cleanup operations
    cleanup(maxAge = 86400000) { // 24 hours default
        const cutoff = new Date(Date.now() - maxAge);

        // Clean up old performance metrics
        for (const [metricName, metrics] of this.state.performance_metrics) {
            const filtered = metrics.filter(m => new Date(m.timestamp) > cutoff);
            this.state.performance_metrics.set(metricName, filtered);
        }

        this.orchestrator.log('INFO', 'State cleanup completed', {
            cutoff_date: cutoff.toISOString(),
            metrics_cleaned: 'performance_metrics'
        });
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PMCRStateManager;
}

console.log('PMCR-O State Management System v1.1 loaded');
