/**
 * Shop Assist AI - Chat Settings Module
 * Handles user preferences: theme, position, sound, history settings
 */
(function(window) {
    'use strict';
    
    // Initialize settings
    function init() {
        // Load saved theme
        const savedTheme = localStorage.getItem('wpAiTheme') || 'blue';
        const $themeSelect = jQuery('#unishine-theme-setting');
        if ($themeSelect.length > 0) {
            $themeSelect.val(savedTheme);
        }
        applyTheme(savedTheme);
        
        // Load saved position
        const savedPosition = localStorage.getItem('wpAiPosition') || 'bottom-right';
        const $positionSelect = jQuery('#wp-ai-position-setting');
        if ($positionSelect.length > 0) {
            $positionSelect.val(savedPosition);
        }
        applyPosition(savedPosition);
        
        // Load sound settings
        const soundEnabled = localStorage.getItem('wpAiSound') !== 'false';
        const $soundCheckbox = jQuery('#wp-ai-sound-enabled');
        if ($soundCheckbox.length > 0) {
            $soundCheckbox.prop('checked', soundEnabled);
        }
        
        // Load history settings
        const historyEnabled = localStorage.getItem('wpAiHistory') !== 'false';
        const $historyCheckbox = jQuery('#wp-ai-history-enabled');
        if ($historyCheckbox.length > 0) {
            $historyCheckbox.prop('checked', historyEnabled);
        }
        
        // Bind event listeners
        bindEventListeners();
    }
    
    // Bind event listeners
    function bindEventListeners() {
        // Theme switch
        jQuery('#unishine-theme-setting').on('change', function() {
            const theme = jQuery(this).val();
            applyTheme(theme);
            localStorage.setItem('wpAiTheme', theme);
        });
        
        // Position switch
        jQuery('#wp-ai-position-setting').on('change', function() {
            const position = jQuery(this).val();
            applyPosition(position);
            localStorage.setItem('wpAiPosition', position);
        });
        
        // Sound toggle
        jQuery('#wp-ai-sound-enabled').on('change', function() {
            localStorage.setItem('wpAiSound', jQuery(this).is(':checked'));
        });
        
        // History toggle
        jQuery('#wp-ai-history-enabled').on('change', function() {
            localStorage.setItem('wpAiHistory', jQuery(this).is(':checked'));
        });
    }
    
    // Apply theme
    function applyTheme(theme) {
        const $container = jQuery('#unishine-shop-assist-container');
        const $window = jQuery('#unishine-shop-assist-window');
        
        // Remove all theme classes
        $container.removeClass('unishine-theme-blue unishine-theme-green unishine-theme-purple unishine-theme-red unishine-theme-dark');
        $window.removeClass('unishine-theme-blue unishine-theme-green unishine-theme-purple unishine-theme-red unishine-theme-dark');
        
        // Add new theme class
        $container.addClass('unishine-theme-' + theme);
        $window.addClass('unishine-theme-' + theme);
    }
    
    // Apply position
    function applyPosition(position) {
        const $container = jQuery('#unishine-shop-assist-container');
        
        // Reset all position styles
        $container.css({
            'top': 'auto',
            'bottom': 'auto',
            'left': 'auto',
            'right': 'auto'
        });
        
        // Apply new position
        const positions = position.split('-');
        if (positions[0] === 'bottom') {
            $container.css('bottom', '20px');
        } else {
            $container.css('top', '20px');
        }
        
        if (positions[1] === 'right') {
            $container.css('right', '20px');
        } else {
            $container.css('left', '20px');
        }
    }
    
    // Expose public API
    window.AIChatbotSettings = {
        init: init,
        applyTheme: applyTheme,
        applyPosition: applyPosition
    };
    
    console.log('[AI ChatBot] Chat Settings module loaded');
    
})(window);