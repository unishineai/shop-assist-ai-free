/**
 * Shop Assist AI - Chat UI Module
 * Handles UI interactions: tab switching, button clicks, window control
 */
(function(window) {
    'use strict';
    
    // Initialize Direct Mode UI
    function initDirectMode(config) {
        // Initialize settings
        if (window.AIChatbotSettings && window.AIChatbotSettings.init) {
            window.AIChatbotSettings.init();
        }
        
        // Bind event listeners
        bindEventListeners();
        
        console.log('[AI ChatBot] Direct Mode UI initialized');
    }
    
    // Initialize Iframe Mode UI
    function initIframeMode(config) {
        // Create iframe and button
        createIframeWidget(config);
        
        console.log('[AI ChatBot] Iframe Mode UI initialized');
    }
    
    // Create iframe widget
    function createIframeWidget(config) {
        // Remove existing widget if any
        jQuery('#unishine-shop-assist-container').remove();
        
        const iframeUrl = config.iframeUrl;
        console.log('[AI ChatBot] Creating iframe widget with URL:', iframeUrl);
        
        const positionStyles = getPositionStyles(config.position);
        const themeClass = `unishine-theme-${config.theme || 'blue'}`;
        
        // Create widget HTML
        const widgetHtml = `
            <div id="unishine-shop-assist-container" class="${themeClass}" style="${positionStyles.container}">
                <button id="unishine-shop-assist-button" style="${positionStyles.button}">💬</button>
                <iframe 
                    id="unishine-shop-assist-iframe"
                    src="${iframeUrl}"
                    style="${positionStyles.iframe}"
                    frameborder="0"
                    allowfullscreen
                ></iframe>
            </div>
        `;
        
        jQuery('body').append(widgetHtml);
        
        console.log('[AI ChatBot] Widget HTML appended to body');
        console.log('[AI ChatBot] Button element:', jQuery('#unishine-shop-assist-button').length);
        console.log('[AI ChatBot] Iframe element:', jQuery('#unishine-shop-assist-iframe').length);
        console.log('[AI ChatBot] Container element:', jQuery('#unishine-shop-assist-container').length);
        
        // 检查容器是否可见
        const $container = jQuery('#unishine-shop-assist-container');
        console.log('[AI ChatBot] Container visible:', $container.is(':visible'));
        console.log('[AI ChatBot] Container display:', $container.css('display'));
        console.log('[AI ChatBot] Container position:', $container.css('position'));
        console.log('[AI ChatBot] Container z-index:', $container.css('z-index'));
        
        // 检查按钮是否可见
        const $button = jQuery('#unishine-shop-assist-button');
        console.log('[AI ChatBot] Button visible:', $button.is(':visible'));
        console.log('[AI ChatBot] Button display:', $button.css('display'));
        console.log('[AI ChatBot] Button position:', $button.css('position'));
        console.log('[AI ChatBot] Button z-index:', $button.css('z-index'));
        console.log('[AI ChatBot] Button width:', $button.width());
        console.log('[AI ChatBot] Button height:', $button.height());
        console.log('[AI ChatBot] Button offset:', $button.offset());
        console.log('[AI ChatBot] Button outerWidth:', $button.outerWidth());
        console.log('[AI ChatBot] Button outerHeight:', $button.outerHeight());
        console.log('[AI ChatBot] Button background:', $button.css('background'));
        console.log('[AI ChatBot] Button color:', $button.css('color'));
        console.log('[AI ChatBot] Button border:', $button.css('border'));
        
        // 检查按钮是否在视口内
        const buttonRect = $button[0].getBoundingClientRect();
        console.log('[AI ChatBot] Button rect:', buttonRect);
        console.log('[AI ChatBot] Button in viewport:', 
            buttonRect.top >= 0 && 
            buttonRect.left >= 0 && 
            buttonRect.bottom <= window.innerHeight && 
            buttonRect.right <= window.innerWidth
        );
        
        // Bind event listeners
        bindIframeEventListeners();
    }
    
    // Get position styles
    function getPositionStyles(position) {
        // 默认位置
        const safePosition = position || 'bottom-right';
        const vertical = safePosition.includes('bottom') ? 'bottom' : 'top';
        const horizontal = safePosition.includes('right') ? 'right' : 'left';
        
        // 顶部偏移量，避免被 WordPress 导航栏遮挡
        const topOffset = 80; // 80px 顶部偏移
        const sideOffset = 20;  // 20px 侧边偏移
        
        return {
            container: `
                position: fixed;
                ${vertical}: ${vertical === 'top' ? topOffset + 'px' : sideOffset + 'px'};
                ${horizontal}: ${sideOffset}px;
                z-index: 9999;
            `,
            button: `
                width: 60px !important;
                height: 60px !important;
                border-radius: 50% !important;
                background-color: #4DA6FF !important;
                background-image: linear-gradient(135deg, #4DA6FF, #1a8cff) !important;
                color: #ffffff !important;
                border: 2px solid #1a8cff !important;
                cursor: pointer !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
                font-size: 24px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                transition: all 0.3s ease !important;
                z-index: 10000 !important;
                position: absolute !important;
                ${vertical === 'top' ? 'top: 0 !important;' : 'bottom: 0 !important;'}
                ${horizontal === 'left' ? 'left: 0 !important;' : 'right: 0 !important;'}
                opacity: 1 !important;
                visibility: visible !important;
                line-height: 1 !important;
                padding: 0 !important;
                margin: 0 !important;
            `,
            iframe: `
                            display: none;
                            position: fixed;
                            ${vertical}: ${vertical === 'top' ? (topOffset + 80) + 'px' : sideOffset + 'px'};
                            ${horizontal}: ${sideOffset}px;
                            width: 380px;
                            height: 600px;
                            border: none;
                            border-radius: 12px;
                            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
                            z-index: 9998;
                            box-sizing: border-box;
                        `
        };
    }
    
    // Bind event listeners for Direct Mode
    function bindEventListeners() {
        // Tab switching
        jQuery('.wp-ai-tab-button').on('click', function() {
            const tabId = jQuery(this).data('tab');
            
            jQuery('.wp-ai-tab-button').removeClass('active');
            jQuery(this).addClass('active');
            
            jQuery('.wp-ai-tab-content').removeClass('active');
            jQuery('#' + tabId + '-tab').addClass('active');
            
            // If switching to history tab, load history
            if (tabId === 'history' && window.AIChatbotHistory) {
                window.AIChatbotHistory.load();
            }
        });
        
        // Send button click
        jQuery('.unishine-shop-assist-send').on('click', function() {
            if (window.AIChatbotCore && window.AIChatbotCore.sendMessage) {
                const message = jQuery('#unishine-shop-assist-input').val().trim();
                window.AIChatbotCore.sendMessage(message).catch(console.error);
            }
        });
        
        // Enter key to send
        jQuery('#unishine-shop-assist-input').on('keypress', function(e) {
            if (e.which === 13) {
                if (window.AIChatbotCore && window.AIChatbotCore.sendMessage) {
                    const message = jQuery('#unishine-shop-assist-input').val().trim();
                    window.AIChatbotCore.sendMessage(message).catch(console.error);
                }
            }
        });
    }
    
    // Bind event listeners for Iframe Mode
    function bindIframeEventListeners() {
        // Toggle chat window
        jQuery('#unishine-shop-assist-button').on('click', toggleIframe);
        
        // Listen for messages from iframe
        window.addEventListener('message', function(event) {
            // Allow cross-origin iframe communication, only validate message type
            if (!event.data || !event.data.type) {
                console.warn('[AI ChatBot] Invalid message format');
                return;
            }
            
            console.log('[AI ChatBot] Received message from iframe:', event.data);
            
            if (event.data.type === 'toggleWindow') {
                toggleIframe();
            } else if (event.data.type === 'closeWidget') {
                console.log('[AI ChatBot] Closing iframe');
                const $iframe = jQuery('#unishine-shop-assist-iframe');
                const $button = jQuery('#unishine-shop-assist-button');
                if ($iframe.length > 0) {
                    $iframe.hide();
                }
                // Show button when iframe is closed
                if ($button.length > 0) {
                    $button.show();
                }
            }
        });
    }
    
    // Toggle iframe visibility
    function toggleIframe() {
        console.log('[AI ChatBot] Toggle iframe clicked');
        const $iframe = jQuery('#unishine-shop-assist-iframe');
        const $button = jQuery('#unishine-shop-assist-button');
        console.log('[AI ChatBot] Iframe element:', $iframe.length);
        console.log('[AI ChatBot] Iframe visible before:', $iframe.is(':visible'));
        console.log('[AI ChatBot] Iframe display before:', $iframe.css('display'));
        
        if ($iframe.length > 0) {
            if ($iframe.is(':visible')) {
                console.log('[AI ChatBot] Hiding iframe');
                $iframe.hide();
                // Show button when iframe is hidden
                if ($button.length > 0) {
                    $button.show();
                }
            } else {
                console.log('[AI ChatBot] Showing iframe');
                $iframe.show();
                // Hide button when iframe is shown
                if ($button.length > 0) {
                    $button.hide();
                }
            }
            
            console.log('[AI ChatBot] Iframe visible after:', $iframe.is(':visible'));
            console.log('[AI ChatBot] Iframe display after:', $iframe.css('display'));
        } else {
            console.error('[AI ChatBot] Iframe element not found');
        }
    }
    
    // Toggle chat window (Direct Mode)
    function toggleWindow() {
        const $window = jQuery('#unishine-shop-assist-window');
        const $button = jQuery('#unishine-shop-assist-button');
        
        if ($window.length > 0) {
            $window.toggleClass('active');
            
            if ($window.hasClass('active')) {
                const $input = jQuery('#unishine-shop-assist-input');
                if ($input.length > 0) {
                    $input.focus();
                }
                // Hide button when window is active
                if ($button.length > 0) {
                    $button.hide();
                }
            } else {
                // Show button when window is inactive
                if ($button.length > 0) {
                    $button.show();
                }
            }
        }
    }
    
    // Open chat window
    function open() {
        const $window = jQuery('#unishine-shop-assist-window');
        const $iframe = jQuery('#unishine-shop-assist-iframe');
        const $button = jQuery('#unishine-shop-assist-button');
        
        if ($window.length > 0) {
            $window.addClass('active');
        } else if ($iframe.length > 0) {
            $iframe.show();
        }
        
        // Hide button when chat window is open
        if ($button.length > 0) {
            $button.hide();
        }
    }
    
    // Close chat window
    function close() {
        const $window = jQuery('#unishine-shop-assist-window');
        const $iframe = jQuery('#unishine-shop-assist-iframe');
        const $button = jQuery('#unishine-shop-assist-button');
        
        if ($window.length > 0) {
            $window.removeClass('active');
        } else if ($iframe.length > 0) {
            $iframe.hide();
        }
        
        // Show button when chat window is closed
        if ($button.length > 0) {
            $button.show();
        }
    }
    
    // Expose public API
    window.AIChatbotUI = {
        initDirectMode: initDirectMode,
        initIframeMode: initIframeMode,
        toggle: toggleWindow,
        open: open,
        close: close
    };
    
    // Expose global function for backward compatibility
    window.wpAiChatbotToggle = toggleWindow;
    
    console.log('[AI ChatBot] Chat UI module loaded');
    
})(window);