/**
 * WP AI ChatBot - Unified Widget Entry Point
 * Loads all chat modules and exposes unified interface
 */
(function() {
    'use strict';
    
    // Configuration object
    let config = {
        renderMode: 'direct',
        apiUrl: '',
        apiKey: '',
        appId: '',
        tenantId: '',
        apiBaseUrl: '',
        iframeUrl: '',
        title: 'AI Assistant',
        position: 'bottom-right',
        theme: 'blue'
    };
    
    // Detect configuration source
    function detectConfig() {
        console.log('[AI ChatBot] Detecting configuration...');
        console.log('[AI ChatBot] wpAiChatbotFree:', window.wpAiChatbotFree);
        console.log('[AI ChatBot] WP_AI_CHATBOT_CONFIG:', window.WP_AI_CHATBOT_CONFIG);

        // Priority 1: Explicit configuration
        if (window.WP_AI_CHATBOT_CONFIG) {
            console.log('[AI ChatBot] Using WP_AI_CHATBOT_CONFIG');
            return window.WP_AI_CHATBOT_CONFIG;
        }

        // Priority 2: WordPress.org plugin configuration
        if (window.wpAiChatbotFree) {
            console.log('[AI ChatBot] Using wpAiChatbotFree');
            return {
                renderMode: window.wpAiChatbotFree.renderMode,
                apiUrl: window.wpAiChatbotFree.apiUrl,
                apiKey: window.wpAiChatbotFree.apiKey,
                title: window.wpAiChatbotFree.title,
                position: window.wpAiChatbotFree.position,
                theme: window.wpAiChatbotFree.theme
            };
        }

        // Priority 3: SaaS plugin configuration
        if (window.AI_CHATBOT_CONFIG) {
            const saasConfig = {
                renderMode: 'iframe',
                ...window.AI_CHATBOT_CONFIG
            };
            
            // Generate iframe URL from app_id and tenant_id
            if (saasConfig.app_id && saasConfig.tenant_id && saasConfig.apiBaseUrl) {
                const params = new URLSearchParams({
                    tenant_id: saasConfig.tenant_id,
                    theme: saasConfig.theme || 'blue',
                    position: saasConfig.position || 'bottom-right',
                    sound: saasConfig.sound !== undefined ? saasConfig.sound : true
                });
                // Ensure HTTPS protocol to avoid Mixed Content errors (only if current page is HTTPS)
                let baseUrl = saasConfig.apiBaseUrl;
                if (window.location.protocol === 'https:' && baseUrl.startsWith('http://')) {
                    baseUrl = baseUrl.replace('http://', 'https://');
                }
                saasConfig.iframeUrl = `${baseUrl}/widget/chat-popup/${saasConfig.app_id}?${params.toString()}`;
            }
            
            return saasConfig;
        }

        // Default configuration
        return config;
    }
    
    // Get module path
    function getModulePath(module) {
        const currentScript = document.currentScript || 
                            document.querySelector('script[src*="ai-chatbot-widget"]');
        
        if (currentScript) {
            // Remove version parameter and script name to get base path
            const src = currentScript.src.split('?')[0]; // Remove query string
            const basePath = src.replace(/ai-chatbot-widget\.js$/, '');
            return basePath + module;
        }
        
        // Fallback: try relative path
        return './' + module;
    }
    
    // Load modules dynamically
    function loadModules() {
        const modules = [
            'chat-core.js',
            'chat-history.js',
            'chat-settings.js',
            'chat-ui.js'
        ];
        
        console.log('[AI ChatBot] Loading modules:', modules);
        
        modules.forEach(function(module) {
            const script = document.createElement('script');
            script.src = getModulePath(module) + '?v=' + Date.now();
            script.async = false; // Load in order
            script.onload = function() {
                console.log('[AI ChatBot] Module loaded:', module);
            };
            script.onerror = function() {
                console.error('[AI ChatBot] Failed to load module:', module);
            };
            document.head.appendChild(script);
        });
    }
    
    // Expose unified interface
    window.AIChatbot = {
        sendMessage: function(message, options) {
            if (window.AIChatbotCore && window.AIChatbotCore.sendMessage) {
                return window.AIChatbotCore.sendMessage(message, options);
            }
            console.error('[AI ChatBot] Core module not loaded yet');
            return Promise.reject('Core module not loaded');
        },
        
        open: function() {
            if (window.AIChatbotUI && window.AIChatbotUI.open) {
                window.AIChatbotUI.open();
            }
        },
        
        close: function() {
            if (window.AIChatbotUI && window.AIChatbotUI.close) {
                window.AIChatbotUI.close();
            }
        },
        
        toggle: function() {
            if (window.AIChatbotUI && window.AIChatbotUI.toggle) {
                window.AIChatbotUI.toggle();
            }
        }
    };
    
    // Backward compatibility - expose immediately
    window.AI_CHATBOT_WIDGET = window.AIChatbot;
    window.wpAiChatbotSend = window.AIChatbot.sendMessage;
    
    // Expose global functions immediately (before modules load)
    window.wpAiChatbotToggle = function() {
        if (window.AIChatbotUI && window.AIChatbotUI.toggle) {
            window.AIChatbotUI.toggle();
        } else {
            console.warn('[AI ChatBot] UI module not loaded yet');
        }
    };
    
    // Store configuration for other modules
    // Note: This will be updated after detectConfig() runs

    // Initialize
    (function init() {
        config = detectConfig();

        // Store configuration for other modules
        window.AIChatbotConfig = config;

        console.log('[AI ChatBot] Initializing with mode:', config.renderMode);

        // Load all modules
        loadModules();

        // Wait for modules to load, then initialize
        var checkLoaded = setInterval(function() {
            console.log('[AI ChatBot] Checking modules loaded...');
            console.log('[AI ChatBot] AIChatbotCore:', window.AIChatbotCore);
            console.log('[AI ChatBot] AIChatbotUI:', window.AIChatbotUI);
            
            if (window.AIChatbotCore && window.AIChatbotUI) {
                clearInterval(checkLoaded);
                console.log('[AI ChatBot] All modules loaded, initializing...');

                // Initialize based on render mode
                if (config.renderMode === 'direct') {
                    if (window.AIChatbotUI.initDirectMode) {
                        window.AIChatbotUI.initDirectMode(config);
                    }
                } else if (config.renderMode === 'iframe') {
                    if (window.AIChatbotUI.initIframeMode) {
                        window.AIChatbotUI.initIframeMode(config);
                    }
                }

                console.log('[AI ChatBot] Initialization complete');
            }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(function() {
            clearInterval(checkLoaded);
            console.warn('[AI ChatBot] Module loading timeout');
        }, 5000);
    })();
    
})();