/**
 * WP AI ChatBot - Chat Core Module
 * Handles message sending, displaying, loading indicators, and typing effects
 */
(function(window) {
    'use strict';
    
    // Assistant name list
    const assistantNames = [
        'Anna', 'Sarah', 'Emily', 'Olivia', 'Sophia', 
        'Michael', 'David', 'Alex', 'James', 'William'
    ];
    
    // Select and save assistant name
    let assistantName = localStorage.getItem('wpAiAssistantName');
    if (!assistantName) {
        assistantName = assistantNames[Math.floor(Math.random() * assistantNames.length)];
        localStorage.setItem('wpAiAssistantName', assistantName);
    }
    
    // Show loading indicator
    function showLoadingIndicator() {
        // Try to find iframe and send message via postMessage
        const iframe = document.querySelector('iframe[src*="widget/chat-popup"]');
        if (iframe && iframe.contentWindow) {
            console.log('[AI ChatBot] Sending showLoadingIndicator to iframe via postMessage');
            iframe.contentWindow.postMessage({
                type: 'showLoadingIndicator',
                assistantName: assistantName
            }, '*');
            return;
        }
        
        // Fallback: try to find messagesContainer in current context
        // Support both #chat-messages (SaaS) and #wp-ai-chatbot-messages (Plugin)
        let messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            messagesContainer = document.getElementById('wp-ai-chatbot-messages');
        }
        
        if (!messagesContainer) {
            console.error('[AI ChatBot] messagesContainer is null!');
            return;
        }
        
        const loadingHtml = `
            <div class="wp-ai-loading-indicator" id="wp-ai-loading">
                <div class="wp-ai-loading-dots">
                    <span></span><span></span><span></span>
                </div>
                <div class="wp-ai-loading-text">${assistantName} is typing...</div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', loadingHtml);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Hide loading indicator
    function hideLoadingIndicator() {
        // Try to find iframe and send message via postMessage
        const iframe = document.querySelector('iframe[src*="widget/chat-popup"]');
        if (iframe && iframe.contentWindow) {
            console.log('[AI ChatBot] Sending hideLoadingIndicator to iframe via postMessage');
            iframe.contentWindow.postMessage({
                type: 'hideLoadingIndicator'
            }, '*');
            return;
        }
        
        // Fallback: remove loading indicator in current context
        const loadingElement = document.getElementById('wp-ai-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    // Add message to chat
    function addMessage(content, type) {
        console.log('[AI ChatBot] addMessage called with:', { content, type });
        
        // Try to find iframe and send message via postMessage
        const iframe = document.querySelector('iframe[src*="widget/chat-popup"]');
        if (iframe && iframe.contentWindow) {
            console.log('[AI ChatBot] Sending message to iframe via postMessage');
            iframe.contentWindow.postMessage({
                type: 'addMessage',
                content: content,
                messageType: type
            }, '*');
            return;
        }
        
        // Fallback: try to find messagesContainer in current context
        // Support both #chat-messages (SaaS) and #wp-ai-chatbot-messages (Plugin)
        let messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            messagesContainer = document.getElementById('wp-ai-chatbot-messages');
        }
        
        console.log('[AI ChatBot] messagesContainer:', messagesContainer);
        
        if (!messagesContainer) {
            console.error('[AI ChatBot] messagesContainer is null! DOM elements:', 
                document.querySelectorAll('#chat-messages, #wp-ai-chatbot-messages'));
            return;
        }
        
        const messageClass = (type === 'user' || type === true) ? 'user' : 'bot';
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `wp-ai-chatbot-message ${messageClass}`;
        
        // Add inline styles for user messages to ensure right alignment
        if (messageClass === 'user') {
            messageDiv.style.setProperty('justify-content', 'flex-end', 'important');
            console.log('[AI ChatBot] Applied inline styles for user message:', {
                justifyContent: messageDiv.style.justifyContent
            });
        }
        
        // Create content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'wp-ai-chatbot-message-content';
        
        // Add message content
        const contentInnerDiv = document.createElement('div');
        contentInnerDiv.innerHTML = content;
        contentDiv.appendChild(contentInnerDiv);
        
        // Add timestamp with date and time
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        const fullTimeString = `${dateString} ${timeString}`;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'wp-ai-message-time';
        timeDiv.textContent = fullTimeString;
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Debug: check computed styles
        setTimeout(() => {
            const computedStyle = window.getComputedStyle(messageDiv);
            console.log('[AI ChatBot] Computed styles:', {
                flexDirection: computedStyle.flexDirection,
                display: computedStyle.display,
                justifyContent: computedStyle.justifyContent
            });
        }, 0);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Display knowledge base cards
    function displayKnowledgeCards(results) {
        console.log('[AI ChatBot] Displaying knowledge cards:', results);
        
        // Play sound notification if enabled
        const soundEnabled = localStorage.getItem('wpAiSound') !== 'false';
        if (soundEnabled) {
            playNotificationSound();
        }
        
        // Try to find iframe and send message via postMessage
        const iframe = document.querySelector('iframe[src*="widget/chat-popup"]');
        if (iframe && iframe.contentWindow) {
            console.log('[AI ChatBot] Sending displayKnowledgeCards to iframe via postMessage');
            iframe.contentWindow.postMessage({
                type: 'displayKnowledgeCards',
                results: results
            }, '*');
            return;
        }
        
        // Fallback: try to find messagesContainer in current context
        // Support both #chat-messages (SaaS) and #wp-ai-chatbot-messages (Plugin)
        let messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            messagesContainer = document.getElementById('wp-ai-chatbot-messages');
        }
        
        if (!messagesContainer) {
            console.error('[AI ChatBot] messagesContainer is null!');
            return;
        }

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = 'wp-ai-chatbot-message bot';
        
        // Create content div
        const contentDiv = document.createElement('div');
        contentDiv.className = 'wp-ai-chatbot-message-content';
        
        // Create knowledge cards container
        const cardsContainer = document.createElement('div');
        cardsContainer.className = 'wp-ai-knowledge-cards';
        
        // Create cards
        results.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = `wp-ai-answer-card ${index === 0 ? 'main-answer' : ''}`;
            card.style.animationDelay = `${index * 0.15}s`;
            
            const cardNumber = document.createElement('div');
            cardNumber.className = 'wp-ai-answer-card-number';
            cardNumber.textContent = `#${index + 1}`;
            
            const cardContent = document.createElement('div');
            cardContent.className = 'wp-ai-answer-card-content';
            cardContent.innerHTML = item.content || 'No content';
            
            card.appendChild(cardNumber);
            card.appendChild(cardContent);
            cardsContainer.appendChild(card);
        });
        
        contentDiv.appendChild(cardsContainer);
        
        // Add timestamp with date and time
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        const dateString = now.toLocaleDateString();
        const fullTimeString = `${dateString} ${timeString}`;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'wp-ai-message-time';
        timeDiv.textContent = fullTimeString;
        contentDiv.appendChild(timeDiv);
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Add card click expand functionality
        document.querySelectorAll('.wp-ai-answer-card').forEach(function(card) {
            card.addEventListener('click', function() {
                this.classList.toggle('expanded');
            });
        });
    }
    
    // Typing animation effect
    function typeMessage(content, isUser) {
        if (isUser) {
            addMessage(content, true);
            return Promise.resolve();
        }
        
        // Play sound notification if enabled
        const soundEnabled = localStorage.getItem('wpAiSound') !== 'false';
        if (soundEnabled) {
            playNotificationSound();
        }
        
        // Try to find iframe and send message via postMessage
        const iframe = document.querySelector('iframe[src*="widget/chat-popup"]');
        if (iframe && iframe.contentWindow) {
            console.log('[AI ChatBot] Sending typeMessage to iframe via postMessage');
            return new Promise(function(resolve) {
                // Send message to iframe
                iframe.contentWindow.postMessage({
                    type: 'typeMessage',
                    content: content
                }, '*');
                
                // Listen for completion message
                var listener = function(event) {
                    if (event.data.type === 'typeMessageComplete') {
                        window.removeEventListener('message', listener);
                        resolve();
                    }
                };
                window.addEventListener('message', listener);
            });
        }
        
        // Fallback: try to find messagesContainer in current context
        // Support both #chat-messages (SaaS) and #wp-ai-chatbot-messages (Plugin)
        let messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) {
            messagesContainer = document.getElementById('wp-ai-chatbot-messages');
        }
        
        if (!messagesContainer) {
            console.error('[AI ChatBot] messagesContainer is null!');
            return Promise.resolve();
        }
        
        const messageHtml = `
            <div class="wp-ai-chatbot-message bot">
                <div class="wp-ai-chatbot-message-content" id="wp-ai-typing-message"></div>
            </div>
        `;
        messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
        
        const typingMsg = document.getElementById('wp-ai-typing-message');
        let index = 0;
        
        return new Promise(function(resolve) {
            function typeChar() {
                if (index < content.length) {
                    typingMsg.textContent = typingMsg.textContent + content.charAt(index);
                    index++;
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    setTimeout(typeChar, 30); // Typing speed
                } else {
                    typingMsg.removeAttribute('id');
                    resolve();
                }
            }
            typeChar();
        });
    }
    
    // Play notification sound
    function playNotificationSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // Frequency in Hz
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.error('[AI ChatBot] Failed to play sound:', error);
        }
    }
    
    // Send message to API
    async function sendMessage(message) {
        console.log('[AI ChatBot] sendMessage called with message:', message);
        const config = window.AIChatbotConfig || {};
        const $input = jQuery('#wp-ai-chatbot-input');
        const $sendBtn = jQuery('.wp-ai-chatbot-send');
        
        if (!message) {
            message = $input.val().trim();
        }
        
        if (!message) return Promise.reject('Empty message');
        
        // Show user message
        addMessage(message, true);
        if ($input.length > 0) {
            $input.val('');
        }
        
        // Disable input
        if ($sendBtn.length > 0) {
            $sendBtn.prop('disabled', true).text('Sending...');
        }
        showLoadingIndicator();
        
        try {
            // Determine API URL and headers based on render mode
            let apiUrl, headers, body;
            
            console.log('[AI ChatBot] Render mode:', config.renderMode);
            
            if (config.renderMode === 'direct') {
                // Direct Mode: Call SaaS API directly
                apiUrl = config.apiUrl + '/v1/chat-messages';
                console.log('[AI ChatBot] Sending message to:', apiUrl);
                console.log('[AI ChatBot] Config:', config);
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + config.apiKey
                };
                body = JSON.stringify({
                    inputs: { input: message },
                    response_mode: 'blocking',
                    user: 'wp-user-' + Date.now()
                });
            } else if (config.renderMode === 'iframe') {
                // Iframe Mode: Use SaaS proxy API
                // Support both app_id/appId and tenant_id/tenantId naming
                const appId = config.appId || config.app_id;
                const tenantId = config.tenantId || config.tenant_id;
                apiUrl = config.apiBaseUrl + '/widget/chat/' + appId + '/' + tenantId;
                headers = {};
                const formData = new FormData();
                formData.append('message', message);
                body = formData;
            } else {
                throw new Error('Unknown render mode: ' + config.renderMode);
            }
            
            console.log('[AI ChatBot] Sending request to:', apiUrl);
            console.log('[AI ChatBot] Request headers:', headers);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: headers,
                body: body
            });
            
            console.log('[AI ChatBot] Response status:', response.status);
            
            hideLoadingIndicator();
            
            if (!response.ok) {
                throw new Error('API request failed: ' + response.status);
            }
            
            const data = await response.json();
            console.log('[AI ChatBot] API Response:', data);
            console.log('[AI ChatBot] data.answer:', data.answer);
            console.log('[AI ChatBot] data.data:', data.data);
            console.log('[AI ChatBot] data.data?.outputs:', data.data?.outputs);
            console.log('[AI ChatBot] data.data?.response:', data.data?.response);
            let answer = '';

            // Parse response - Support both SaaS and Dify formats
            if (data.answer) {
                // SaaS platform format
                answer = data.answer;

                // Check if there are knowledge base results in outputs
                if (data.data && data.data.outputs && data.data.outputs.outpu) {
                    const outpu_list = data.data.outputs.outpu;
                    console.log('[AI ChatBot] Knowledge base results:', outpu_list);
                    if (outpu_list && outpu_list.length > 0) {
                        // Display knowledge base cards
                        displayKnowledgeCards(outpu_list);

                        // Save to history
                        if (window.AIChatbotHistory) {
                            const answerText = outpu_list.map((item, i) => `${i + 1}. ${item.content}`).join('\n');
                            window.AIChatbotHistory.save(message, answerText);
                        }

                        return { success: true, data: data };
                    }
                }
            } else if (data.data && data.data.outputs) {
                // Dify original format
                const outputs = data.data.outputs;
                if (outputs.outpu && Array.isArray(outputs.outpu)) {
                    // Display knowledge base results in card mode
                    displayKnowledgeCards(outputs.outpu);
                    
                    // Save to history
                    if (window.AIChatbotHistory) {
                        const answerText = outputs.outpu.map((item, i) => `${i + 1}. ${item.content}`).join('\n');
                        window.AIChatbotHistory.save(message, answerText);
                    }
                    
                    return { success: true, data: data };
                } else {
                    answer = outputs.result || outputs.text || outputs.answer || '';
                }
            } else if (data.data && data.data.response) {
                // SaaS platform format with response field
                answer = data.data.response;
            }
            
            if (!answer) {
                answer = 'Sorry, I could not find relevant information.';
            }
            
            // Display response with typing animation
            await typeMessage(answer, false);
            
            // Save to history
            if (window.AIChatbotHistory) {
                window.AIChatbotHistory.save(message, answer);
            }
            
            return { success: true, data: data };
            
        } catch (error) {
            hideLoadingIndicator();
            console.error('[AI ChatBot] Chat error:', error);
            addMessage('Sorry, the service is temporarily unavailable.', false);
            throw error;
        } finally {
            if ($sendBtn.length > 0) {
                $sendBtn.prop('disabled', false).text('Send');
            }
            if ($input.length > 0) {
                $input.focus();
            }
        }
    }
    
    // Expose public API
    window.AIChatbotCore = {
        sendMessage: sendMessage,
        addMessage: addMessage,
        displayKnowledgeCards: displayKnowledgeCards,
        typeMessage: typeMessage,
        showLoadingIndicator: showLoadingIndicator,
        hideLoadingIndicator: hideLoadingIndicator
    };
    
    console.log('[AI ChatBot] Chat Core module loaded');
    
})(window);