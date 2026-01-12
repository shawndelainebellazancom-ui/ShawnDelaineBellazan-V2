/**
 * CURSOR INTEGRATION FRAMEWORK v1.1
 * Seamless integration with Cursor IDE for Meta-Orchestrator
 */

class CursorIntegrationFramework {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
        this.cursorApi = null;
        this.workspaceState = {};
        this.activeOperations = new Map();

        // Initialize Cursor integration
        this.initializeCursorIntegration();
    }

    // Initialize Cursor IDE integration
    async initializeCursorIntegration() {
        try {
            // Detect Cursor environment
            this.cursorApi = this.detectCursorAPI();

            if (this.cursorApi) {
                this.orchestrator.log('INFO', 'Cursor IDE integration initialized', {
                    api_version: this.cursorApi.version || 'unknown',
                    capabilities: this.getCursorCapabilities()
                });

                // Setup event listeners
                this.setupCursorEventListeners();

                // Initialize workspace state
                await this.initializeWorkspaceState();

            } else {
                this.orchestrator.log('WARN', 'Cursor API not detected, running in compatibility mode');
                this.enableCompatibilityMode();
            }

        } catch (error) {
            this.orchestrator.log('ERROR', 'Failed to initialize Cursor integration', { error: error.message });
            this.enableCompatibilityMode();
        }
    }

    // Detect Cursor API availability
    detectCursorAPI() {
        // Check for Cursor-specific global objects or APIs
        if (typeof cursor !== 'undefined') {
            return cursor;
        }

        // Check for Cursor-specific environment variables
        if (typeof process !== 'undefined' && process.env) {
            if (process.env.CURSOR_RUNTIME || process.env.CURSOR_VERSION) {
                return {
                    version: process.env.CURSOR_VERSION || 'detected',
                    runtime: process.env.CURSOR_RUNTIME || 'standard',
                    capabilities: ['file_operations', 'terminal', 'browser_tools', 'search']
                };
            }
        }

        // Check for Cursor-specific user agent or other indicators
        if (typeof navigator !== 'undefined' && navigator.userAgent) {
            if (navigator.userAgent.includes('Cursor')) {
                return {
                    version: 'detected_via_ua',
                    capabilities: ['basic_operations']
                };
            }
        }

        return null;
    }

    // Get available Cursor capabilities
    getCursorCapabilities() {
        const capabilities = [];

        // File operations
        if (this.canPerformFileOperations()) capabilities.push('file_operations');

        // Terminal operations
        if (this.canPerformTerminalOperations()) capabilities.push('terminal_operations');

        // Browser tools
        if (this.canPerformBrowserOperations()) capabilities.push('browser_tools');

        // Search capabilities
        if (this.canPerformSearchOperations()) capabilities.push('search_capabilities');

        // Code intelligence
        if (this.canAccessCodeIntelligence()) capabilities.push('code_intelligence');

        return capabilities;
    }

    // Capability checks
    canPerformFileOperations() {
        return typeof read_file === 'function' ||
               typeof search_replace === 'function' ||
               typeof write === 'function' ||
               (this.cursorApi && this.cursorApi.fileOperations);
    }

    canPerformTerminalOperations() {
        return typeof run_terminal_cmd === 'function' ||
               (this.cursorApi && this.cursorApi.terminalOperations);
    }

    canPerformBrowserOperations() {
        return typeof mcp_cursor_ide_browser_browser_navigate === 'function' ||
               (this.cursorApi && this.cursorApi.browserTools);
    }

    canPerformSearchOperations() {
        return typeof grep === 'function' ||
               typeof codebase_search === 'function' ||
               (this.cursorApi && this.cursorApi.searchCapabilities);
    }

    canAccessCodeIntelligence() {
        return this.cursorApi && this.cursorApi.codeIntelligence;
    }

    // Setup event listeners for Cursor events
    setupCursorEventListeners() {
        if (!this.cursorApi) return;

        // File system events
        this.setupFileSystemListeners();

        // Terminal events
        this.setupTerminalListeners();

        // Browser events
        this.setupBrowserListeners();

        // Workspace events
        this.setupWorkspaceListeners();
    }

    setupFileSystemListeners() {
        // Listen for file changes, saves, etc.
        if (this.cursorApi.onFileChange) {
            this.cursorApi.onFileChange((event) => {
                this.handleFileChange(event);
            });
        }
    }

    setupTerminalListeners() {
        // Listen for terminal command completions
        if (this.cursorApi.onTerminalComplete) {
            this.cursorApi.onTerminalComplete((event) => {
                this.handleTerminalComplete(event);
            });
        }
    }

    setupBrowserListeners() {
        // Listen for browser navigation and interactions
        if (this.cursorApi.onBrowserEvent) {
            this.cursorApi.onBrowserEvent((event) => {
                this.handleBrowserEvent(event);
            });
        }
    }

    setupWorkspaceListeners() {
        // Listen for workspace changes
        if (this.cursorApi.onWorkspaceChange) {
            this.cursorApi.onWorkspaceChange((event) => {
                this.handleWorkspaceChange(event);
            });
        }
    }

    // Event handlers
    handleFileChange(event) {
        this.orchestrator.log('DEBUG', 'File change detected', {
            file: event.file,
            operation: event.operation,
            timestamp: event.timestamp
        });

        // Update workspace state
        this.updateWorkspaceFile(event.file, event.operation);
    }

    handleTerminalComplete(event) {
        const operationId = event.operationId;
        if (this.activeOperations.has(operationId)) {
            const operation = this.activeOperations.get(operationId);
            operation.completed = true;
            operation.result = event.result;
            operation.endTime = new Date().toISOString();

            this.orchestrator.log('INFO', 'Terminal operation completed', {
                operation_id: operationId,
                command: operation.command,
                success: event.success,
                duration: operation.endTime ? new Date(operation.endTime) - new Date(operation.startTime) : 0
            });

            // Notify any waiting promises
            if (operation.resolve) {
                operation.resolve(event.result);
            }
        }
    }

    handleBrowserEvent(event) {
        this.orchestrator.log('DEBUG', 'Browser event detected', {
            type: event.type,
            url: event.url,
            timestamp: event.timestamp
        });
    }

    handleWorkspaceChange(event) {
        this.orchestrator.log('INFO', 'Workspace change detected', {
            type: event.type,
            affected_files: event.affectedFiles,
            timestamp: event.timestamp
        });

        // Refresh workspace state
        this.refreshWorkspaceState();
    }

    // Workspace state management
    async initializeWorkspaceState() {
        try {
            this.workspaceState = {
                rootPath: await this.getWorkspaceRoot(),
                openFiles: await this.getOpenFiles(),
                recentFiles: await this.getRecentFiles(),
                projectStructure: await this.getProjectStructure(),
                lastUpdated: new Date().toISOString()
            };

            this.orchestrator.log('INFO', 'Workspace state initialized', {
                root_path: this.workspaceState.rootPath,
                open_files_count: this.workspaceState.openFiles.length,
                project_files_count: this.workspaceState.projectStructure?.length || 0
            });

        } catch (error) {
            this.orchestrator.log('ERROR', 'Failed to initialize workspace state', { error: error.message });
        }
    }

    async refreshWorkspaceState() {
        await this.initializeWorkspaceState();
    }

    updateWorkspaceFile(filePath, operation) {
        // Update file tracking
        if (operation === 'open') {
            if (!this.workspaceState.openFiles.includes(filePath)) {
                this.workspaceState.openFiles.push(filePath);
            }
        } else if (operation === 'close') {
            const index = this.workspaceState.openFiles.indexOf(filePath);
            if (index > -1) {
                this.workspaceState.openFiles.splice(index, 1);
            }
        }

        this.workspaceState.lastUpdated = new Date().toISOString();
    }

    // Core integration methods
    async readFile(filePath, options = {}) {
        const operationId = this.generateOperationId();

        try {
            this.orchestrator.log('DEBUG', 'Reading file via Cursor integration', { file_path: filePath });

            if (typeof read_file === 'function') {
                const result = await read_file({
                    target_file: filePath,
                    offset: options.offset,
                    limit: options.limit
                });
                return result;
            } else if (this.cursorApi && this.cursorApi.readFile) {
                return await this.cursorApi.readFile(filePath, options);
            } else {
                throw new Error('File reading not supported in current environment');
            }

        } catch (error) {
            this.orchestrator.log('ERROR', 'File read operation failed', {
                file_path: filePath,
                error: error.message,
                operation_id: operationId
            });
            throw error;
        }
    }

    async writeFile(filePath, content, options = {}) {
        const operationId = this.generateOperationId();

        try {
            this.orchestrator.log('DEBUG', 'Writing file via Cursor integration', { file_path: filePath });

            if (typeof write === 'function') {
                await write({
                    file_path: filePath,
                    contents: content
                });
                return { success: true };
            } else if (this.cursorApi && this.cursorApi.writeFile) {
                return await this.cursorApi.writeFile(filePath, content, options);
            } else {
                throw new Error('File writing not supported in current environment');
            }

        } catch (error) {
            this.orchestrator.log('ERROR', 'File write operation failed', {
                file_path: filePath,
                error: error.message,
                operation_id: operationId
            });
            throw error;
        }
    }

    async searchReplace(filePath, oldString, newString, options = {}) {
        const operationId = this.generateOperationId();

        try {
            this.orchestrator.log('DEBUG', 'Performing search-replace via Cursor integration', { file_path: filePath });

            if (typeof search_replace === 'function') {
                await search_replace({
                    file_path: filePath,
                    old_string: oldString,
                    new_string: newString,
                    replace_all: options.replaceAll || false
                });
                return { success: true };
            } else if (this.cursorApi && this.cursorApi.searchReplace) {
                return await this.cursorApi.searchReplace(filePath, oldString, newString, options);
            } else {
                throw new Error('Search-replace not supported in current environment');
            }

        } catch (error) {
            this.orchestrator.log('ERROR', 'Search-replace operation failed', {
                file_path: filePath,
                error: error.message,
                operation_id: operationId
            });
            throw error;
        }
    }

    async runTerminalCommand(command, options = {}) {
        const operationId = this.generateOperationId();

        try {
            this.orchestrator.log('DEBUG', 'Running terminal command via Cursor integration', { command: command });

            if (typeof run_terminal_cmd === 'function') {
                const result = await run_terminal_cmd({
                    command: command,
                    is_background: options.background || false
                });

                // Track operation
                this.activeOperations.set(operationId, {
                    id: operationId,
                    type: 'terminal',
                    command: command,
                    startTime: new Date().toISOString(),
                    background: options.background || false
                });

                return {
                    operationId,
                    success: result.exit_code === 0,
                    output: result.output
                };
            } else if (this.cursorApi && this.cursorApi.runTerminalCommand) {
                return await this.cursorApi.runTerminalCommand(command, options);
            } else {
                throw new Error('Terminal operations not supported in current environment');
            }

        } catch (error) {
            this.orchestrator.log('ERROR', 'Terminal command failed', {
                command: command,
                error: error.message,
                operation_id: operationId
            });
            throw error;
        }
    }

    async searchCodebase(query, options = {}) {
        const operationId = this.generateOperationId();

        try {
            this.orchestrator.log('DEBUG', 'Searching codebase via Cursor integration', { query: query });

            if (typeof codebase_search === 'function') {
                const result = await codebase_search({
                    explanation: options.explanation || 'Codebase search for meta-orchestrator',
                    query: query,
                    target_directories: options.targetDirectories || []
                });
                return result;
            } else if (typeof grep === 'function') {
                const result = await grep({
                    pattern: query,
                    path: options.path,
                    output_mode: options.outputMode || 'content',
                    context: options.context || 2
                });
                return result;
            } else if (this.cursorApi && this.cursorApi.searchCodebase) {
                return await this.cursorApi.searchCodebase(query, options);
            } else {
                throw new Error('Codebase search not supported in current environment');
            }

        } catch (error) {
            this.orchestrator.log('ERROR', 'Codebase search failed', {
                query: query,
                error: error.message,
                operation_id: operationId
            });
            throw error;
        }
    }

    async navigateBrowser(url, options = {}) {
        const operationId = this.generateOperationId();

        try {
            this.orchestrator.log('DEBUG', 'Navigating browser via Cursor integration', { url: url });

            if (typeof mcp_cursor_ide_browser_browser_navigate === 'function') {
                await mcp_cursor_ide_browser_browser_navigate({ url });
                return { success: true };
            } else if (this.cursorApi && this.cursorApi.navigateBrowser) {
                return await this.cursorApi.navigateBrowser(url, options);
            } else {
                throw new Error('Browser navigation not supported in current environment');
            }

        } catch (error) {
            this.orchestrator.log('ERROR', 'Browser navigation failed', {
                url: url,
                error: error.message,
                operation_id: operationId
            });
            throw error;
        }
    }

    // Utility methods
    generateOperationId() {
        return `cursor_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async getWorkspaceRoot() {
        if (this.cursorApi && this.cursorApi.getWorkspaceRoot) {
            return await this.cursorApi.getWorkspaceRoot();
        }
        // Fallback to environment or current working directory
        return process.cwd();
    }

    async getOpenFiles() {
        if (this.cursorApi && this.cursorApi.getOpenFiles) {
            return await this.cursorApi.getOpenFiles();
        }
        return [];
    }

    async getRecentFiles() {
        if (this.cursorApi && this.cursorApi.getRecentFiles) {
            return await this.cursorApi.getRecentFiles();
        }
        return [];
    }

    async getProjectStructure() {
        if (this.cursorApi && this.cursorApi.getProjectStructure) {
            return await this.cursorApi.getProjectStructure();
        }

        // Fallback: try to list directory
        try {
            if (typeof list_dir === 'function') {
                const result = await list_dir({ target_directory: '.' });
                return result;
            }
        } catch (error) {
            this.orchestrator.log('DEBUG', 'Could not get project structure', { error: error.message });
        }

        return [];
    }

    // Compatibility mode for non-Cursor environments
    enableCompatibilityMode() {
        this.orchestrator.log('INFO', 'Enabling Cursor compatibility mode');

        // Create mock implementations for basic operations
        this.cursorApi = {
            version: 'compatibility_mode',
            capabilities: ['basic_file_operations'],
            readFile: this.fallbackReadFile.bind(this),
            writeFile: this.fallbackWriteFile.bind(this),
            searchReplace: this.fallbackSearchReplace.bind(this)
        };
    }

    async fallbackReadFile(filePath, options = {}) {
        // Basic file reading using Node.js fs
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');

            try {
                const fullPath = path.resolve(filePath);
                let content = fs.readFileSync(fullPath, 'utf8');

                if (options.offset || options.limit) {
                    const lines = content.split('\n');
                    const start = options.offset || 0;
                    const end = options.limit ? start + options.limit : lines.length;
                    content = lines.slice(start, end).join('\n');
                }

                return content;
            } catch (error) {
                throw new Error(`File read failed: ${error.message}`);
            }
        }
        throw new Error('File reading not available in this environment');
    }

    async fallbackWriteFile(filePath, content, options = {}) {
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');

            try {
                const fullPath = path.resolve(filePath);
                fs.writeFileSync(fullPath, content, 'utf8');
                return { success: true };
            } catch (error) {
                throw new Error(`File write failed: ${error.message}`);
            }
        }
        throw new Error('File writing not available in this environment');
    }

    async fallbackSearchReplace(filePath, oldString, newString, options = {}) {
        if (typeof require !== 'undefined') {
            const fs = require('fs');
            const path = require('path');

            try {
                const fullPath = path.resolve(filePath);
                let content = fs.readFileSync(fullPath, 'utf8');

                if (options.replaceAll) {
                    content = content.replace(new RegExp(oldString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newString);
                } else {
                    content = content.replace(oldString, newString);
                }

                fs.writeFileSync(fullPath, content, 'utf8');
                return { success: true };
            } catch (error) {
                throw new Error(`Search-replace failed: ${error.message}`);
            }
        }
        throw new Error('Search-replace not available in this environment');
    }

    // Status and monitoring
    getIntegrationStatus() {
        return {
            cursor_detected: !!this.cursorApi,
            compatibility_mode: !this.canPerformFileOperations(),
            capabilities: this.getCursorCapabilities(),
            workspace_initialized: !!this.workspaceState.rootPath,
            active_operations: this.activeOperations.size,
            last_updated: this.workspaceState.lastUpdated || new Date().toISOString()
        };
    }

    // Cleanup
    dispose() {
        // Clean up event listeners and operations
        this.activeOperations.clear();
        this.workspaceState = {};

        this.orchestrator.log('INFO', 'Cursor integration framework disposed');
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CursorIntegrationFramework;
}

console.log('Cursor Integration Framework v1.1 loaded');
