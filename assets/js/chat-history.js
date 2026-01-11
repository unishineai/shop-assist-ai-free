/**
 * WP AI ChatBot - Chat History Module
 * Handles chat history management: save, load, clear, export
 */
(function(window) {
    'use strict';
    
    const HISTORY_KEY = 'wpAiChatHistory';
    const MAX_HISTORY = 50;
    
    // Save chat history to localStorage
    function save(question, answer) {
        // Check if history is enabled
        const historyEnabled = localStorage.getItem('wpAiHistory') !== 'false';
        if (!historyEnabled) {
            return;
        }
        
        // Process answer format
        let answerContent = '';
        if (typeof answer === 'string') {
            // If multi-line answer, only save first line
            const lines = answer.split('\n').filter(line => line.trim());
            answerContent = lines[0] || answer;
            // Remove numbering (e.g., "1. ")
            answerContent = answerContent.replace(/^\d+\.\s*/, '');
        } else {
            answerContent = String(answer);
        }
        
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        history.unshift({
            question: question,
            answer: answerContent,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleString('en-US')
        });
        
        // Keep only last MAX_HISTORY entries
        if (history.length > MAX_HISTORY) {
            history.splice(MAX_HISTORY);
        }
        
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
    
    // Load chat history
    function load() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const $historyList = jQuery('#wp-ai-history-list');
        
        if (history.length === 0) {
            $historyList.html('<p style="text-align: center; color: #999; padding: 20px;">No chat history yet</p>');
            return;
        }
        
        $historyList.empty();
        history.forEach(function(item, index) {
            const $item = jQuery(`
                <div class="wp-ai-history-item" data-index="${index}">
                    <div class="wp-ai-history-question">${item.question}</div>
                    <div class="wp-ai-history-time">${item.time}</div>
                </div>
            `);
            
            $item.on('click', function() {
                // Switch to chat tab and fill question
                jQuery('.wp-ai-tab-button[data-tab="chat"]').click();
                const $input = jQuery('#wp-ai-chatbot-input');
                if ($input.length > 0) {
                    $input.val(item.question);
                }
            });
            
            $historyList.append($item);
        });
    }
    
    // Clear chat history
    function clear() {
        if (confirm('Are you sure you want to clear all chat history?')) {
            localStorage.removeItem(HISTORY_KEY);
            load();
            alert('Chat history has been cleared.');
        }
    }
    
    // Export chat history to TXT file
    function exportHistory() {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        
        if (history.length === 0) {
            alert('No chat history to export.');
            return;
        }
        
        // Generate text content
        let content = '=== WP AI ChatBot - Chat History Export ===\n';
        content += 'Exported: ' + new Date().toLocaleString('en-US') + '\n';
        content += 'Total conversations: ' + history.length + '\n';
        content += '==========================================\n\n';
        
        history.forEach(function(item, index) {
            content += `[${index + 1}] ${item.time}\n`;
            content += `Q: ${item.question}\n`;
            content += `A: ${item.answer}\n`;
            content += '---\n\n';
        });
        
        // Create download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history-' + new Date().toISOString().slice(0,10) + '.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        alert('Chat history exported successfully!');
    }
    
    // Expose public API
    window.AIChatbotHistory = {
        save: save,
        load: load,
        clear: clear,
        export: exportHistory
    };
    
    // Expose global functions for backward compatibility
    window.wpAiClearHistory = clear;
    window.wpAiExportHistory = exportHistory;
    
    console.log('[AI ChatBot] Chat History module loaded');
    
})(window);