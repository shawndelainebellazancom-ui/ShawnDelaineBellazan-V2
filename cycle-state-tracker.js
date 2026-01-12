/**
 * PMCR-O Cycle State Tracker v1.1
 * Enterprise logging and state management for Meta-Orchestrator
 */

class PMCRCycleTracker {
    constructor() {
        this.cycles = {
            PLANNER: { status: 'active', startTime: new Date().toISOString(), artifacts: [] },
            MAKER: { status: 'pending', startTime: null, artifacts: [] },
            CHECKER: { status: 'pending', startTime: null, artifacts: [] },
            REFLECTOR: { status: 'pending', startTime: null, artifacts: [] },
            ORCHESTRATOR: { status: 'pending', startTime: null, artifacts: [] }
        };
        this.currentPhase = 'PLANNER';
        this.logEntries = [];
        this.validationChecks = {
            bip_logic_check_1: true, // Runtime and tooling confirmed
            bip_logic_check_2: true, // Seed intent restated
            bip_logic_check_3: true, // Phase selected appropriately
            bip_logic_check_4: true, // External validation handled correctly
            bip_logic_check_5: true  // Artifacts generated
        };
    }

    // Enterprise logging function
    log(level, message, metadata = {}) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            phase: this.currentPhase,
            message: message,
            metadata: {
                ...metadata,
                agent_id: 'meta-orchestrator-v1_1',
                cycle_state: this.getCurrentCycleState()
            }
        };

        this.logEntries.push(entry);
        console.log(`[${entry.timestamp}] ${level.toUpperCase()} [${this.currentPhase}]: ${message}`);

        // Log to file if in Node.js environment
        if (typeof process !== 'undefined' && process.env) {
            this.appendToLogFile(entry);
        }

        return entry;
    }

    // Phase transition with validation
    transitionToPhase(newPhase) {
        const validTransitions = {
            'PLANNER': ['MAKER'],
            'MAKER': ['CHECKER'],
            'CHECKER': ['REFLECTOR'],
            'REFLECTOR': ['ORCHESTRATOR'],
            'ORCHESTRATOR': ['PLANNER'] // Cycle completion
        };

        if (!validTransitions[this.currentPhase]?.includes(newPhase)) {
            this.log('ERROR', `Invalid phase transition from ${this.currentPhase} to ${newPhase}`);
            throw new Error(`Cannot transition from ${this.currentPhase} to ${newPhase}`);
        }

        // Complete current phase
        this.cycles[this.currentPhase].endTime = new Date().toISOString();
        this.cycles[this.currentPhase].status = 'completed';

        // Start new phase
        this.cycles[newPhase].status = 'active';
        this.cycles[newPhase].startTime = new Date().toISOString();
        this.currentPhase = newPhase;

        this.log('INFO', `Phase transition: ${this.cycles[this.currentPhase].status} → ${newPhase}`, {
            previous_phase: this.cycles[this.currentPhase].status,
            new_phase: newPhase,
            transition_timestamp: new Date().toISOString()
        });
    }

    // Add artifact to current phase
    addArtifact(artifactPath, artifactType, description) {
        const artifact = {
            path: artifactPath,
            type: artifactType,
            description: description,
            created_at: new Date().toISOString(),
            phase: this.currentPhase
        };

        this.cycles[this.currentPhase].artifacts.push(artifact);
        this.log('INFO', `Artifact added: ${artifactPath}`, {
            artifact_type: artifactType,
            phase: this.currentPhase
        });
    }

    // BIP logic validation
    validateBIPLogic(checkNumber, passed, details = '') {
        const checkKey = `bip_logic_check_${checkNumber}`;
        this.validationChecks[checkKey] = passed;

        this.log(passed ? 'INFO' : 'WARN', `BIP Logic Check ${checkNumber}: ${passed ? 'PASSED' : 'FAILED'}`, {
            check_details: details,
            validation_timestamp: new Date().toISOString()
        });
    }

    // Get current cycle state snapshot
    getCurrentCycleState() {
        return {
            current_phase: this.currentPhase,
            cycles: { ...this.cycles },
            validation_checks: { ...this.validationChecks },
            total_artifacts: Object.values(this.cycles).reduce((sum, cycle) => sum + cycle.artifacts.length, 0),
            last_updated: new Date().toISOString()
        };
    }

    // Export state for persistence
    exportState() {
        return {
            meta: {
                agent_id: 'meta-orchestrator-v1_1',
                export_timestamp: new Date().toISOString(),
                version: '1.1'
            },
            state: this.getCurrentCycleState(),
            logs: this.logEntries.slice(-100) // Last 100 entries
        };
    }

    // File logging for enterprise environments
    appendToLogFile(entry) {
        // In browser environment, this would use localStorage or send to server
        // In Node.js environment, this would write to file system
        try {
            if (typeof localStorage !== 'undefined') {
                const existingLogs = localStorage.getItem('pmcro_logs') || '[]';
                const logs = JSON.parse(existingLogs);
                logs.push(entry);
                // Keep only last 500 entries in localStorage
                if (logs.length > 500) logs.splice(0, logs.length - 500);
                localStorage.setItem('pmcro_logs', JSON.stringify(logs));
            }
        } catch (error) {
            console.warn('Could not persist log to storage:', error);
        }
    }

    // Self-verification method
    selfVerify() {
        const issues = [];

        // Check all BIP logic validations pass
        const bipChecks = Object.entries(this.validationChecks);
        bipChecks.forEach(([check, passed]) => {
            if (!passed) {
                issues.push(`BIP Logic Check failed: ${check}`);
            }
        });

        // Check phase progression is valid
        const phaseOrder = ['PLANNER', 'MAKER', 'CHECKER', 'REFLECTOR', 'ORCHESTRATOR'];
        const currentIndex = phaseOrder.indexOf(this.currentPhase);
        if (currentIndex === -1) {
            issues.push(`Invalid current phase: ${this.currentPhase}`);
        }

        // Check artifacts exist for current phase
        if (this.cycles[this.currentPhase].artifacts.length === 0) {
            issues.push(`No artifacts generated for current phase: ${this.currentPhase}`);
        }

        if (issues.length > 0) {
            this.log('ERROR', 'Self-verification failed', { issues });
            return { valid: false, issues };
        }

        this.log('INFO', 'Self-verification passed');
        return { valid: true, issues: [] };
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.pmcroCycleTracker = new PMCRCycleTracker();
} else if (typeof global !== 'undefined') {
    global.pmcroCycleTracker = new PMCRCycleTracker();
}

// Create global instance
const pmcroCycleTracker = new PMCRCycleTracker();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PMCRCycleTracker, pmcroCycleTracker };
} else if (typeof window !== 'undefined') {
    window.pmcroCycleTracker = pmcroCycleTracker;
} else if (typeof global !== 'undefined') {
    global.pmcroCycleTracker = pmcroCycleTracker;
}

console.log('PMCR-O Cycle State Tracker v1.1 initialized');
