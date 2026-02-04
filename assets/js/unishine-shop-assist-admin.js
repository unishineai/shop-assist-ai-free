/* Admin inline JavaScript for UniShine Shop Assist plugin */
(function($) {
    'use strict';

    // Load usage statistics
    function loadUsageStats() {
        if (!window.unishineShopAssist.apiUrl || !window.unishineShopAssist.apiKey) {
            $('#usage-stats').html(
                '<div style="text-align: center; padding: 20px;"><p style="color: #ff7a00; font-size: 16px; margin: 0;">⚠️ Please configure API URL and API Key first</p></div>'
            );
            return;
        }

        $.ajax({
            url: window.unishineShopAssist.apiUrl + '/tenant/usage',
            method: 'GET',
            headers: {
                'X-API-Key': window.unishineShopAssist.apiKey
            },
            success: function(data) {
                const stats = data;
                const qaCount = stats.qa_count || 0;
                const totalWords = stats.total_words || 0;
                const chatCount = stats.chat_count || 0;

                const qaProgress = Math.min((qaCount / 50) * 100, 100);
                const wordsProgress = Math.min((totalWords / 5000) * 100, 100);
                const chatProgress = Math.min((chatCount / 200) * 100, 100);

                $('#usage-stats').html(`
                    <div class="usage-item">
                        <h4>Q/A Pairs</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${qaProgress}%"></div>
                        </div>
                        <p>${qaCount} / 50</p>
                    </div>
                    <div class="usage-item">
                        <h4>Total Words</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${wordsProgress}%"></div>
                        </div>
                        <p>${totalWords.toLocaleString()} / 5,000</p>
                    </div>
                    <div class="usage-item">
                        <h4>Chat Sessions</h4>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${chatProgress}%"></div>
                        </div>
                        <p>${chatCount} / 200</p>
                    </div>
                `);

                if (qaProgress >= 100 || wordsProgress >= 100 || chatProgress >= 100) {
                    showUpgradeBanner();
                }
            },
            error: function() {
                $('#usage-stats').html(
                    '<div style="text-align: center; padding: 20px;"><p style="color: #ff4d4f; font-size: 16px; margin: 0;">❌ Failed to load usage statistics</p></div>'
                );
            }
        });
    }

    // Show upgrade banner
    function showUpgradeBanner() {
        $('#usage-stats').append(`
            <div class="upgrade-banner" style="margin-top: 20px; padding: 16px; background: linear-gradient(135deg, #fff7e6 0%, #ffecc7 100%); border-radius: 8px; border: 1px solid #ffd591;">
                <h3 style="margin: 0 0 8px 0; color: #ff7a00; font-size: 18px;">🚀 Upgrade to Pro</h3>
                <p style="margin: 0; color: #666; font-size: 14px;">You've reached the free tier limits. Upgrade for unlimited usage!</p>
                <a href="${window.unishineShopAssist.saasUrl}" target="_blank" style="display: inline-block; margin-top: 12px; padding: 8px 16px; background: #ff7a00; color: white; text-decoration: none; border-radius: 6px; font-size: 14px; transition: all 0.3s;">Get Started</a>
            </div>
        `);
    }

    // Check API connection
    function checkApiConnection() {
        if (!window.unishineShopAssist.apiUrl || !window.unishineShopAssist.apiKey) {
            $('#connection-status').html(
                '<div style="padding: 20px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;"><p style="text-align: center; color: #ff7a00; font-size: 16px; margin: 0;">⚠️ Please configure API URL and API Key first</p></div>'
            );
            return;
        }

        $('#connection-status').html(
            '<div style="padding: 20px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;"><p style="text-align: center; color: #ff7a00; font-size: 16px; margin: 0;">⏳ Checking connection...</p></div>'
        );

        $.ajax({
            url: window.unishineShopAssist.apiUrl + '/tenant/usage',
            method: 'GET',
            headers: {
                'X-API-Key': window.unishineShopAssist.apiKey
            },
            success: function() {
                $('#connection-status').html(
                    '<div style="padding: 20px; background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%); border-radius: 8px; border: 1px solid #b7eb8f;"><p style="text-align: center; color: #52c41a; font-size: 16px; margin: 0;">✅ Connection successful!</p></div>'
                );
                loadUsageStats();
            },
            error: function() {
                $('#connection-status').html(
                    '<div style="padding: 20px; background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%); border-radius: 8px; border: 1px solid #ffccc7;"><p style="text-align: center; color: #ff4d4f; font-size: 16px; margin: 0;">❌ Connection failed. Please check your API URL and API Key.</p></div>'
                );
            }
        });
    }

    // Initialize on document ready
    $(document).ready(function() {
        // Make data available globally
        if (typeof window.unishineShopAssist === 'undefined') {
            window.unishineShopAssist = {};
        }

        // Load usage stats if on settings page
        if ($('#usage-stats').length) {
            loadUsageStats();
        }

        // Check connection if button exists
        $('#check-connection-btn').on('click', checkApiConnection);

        // Save settings
        $('#save-settings-btn').on('click', function() {
            $('#settings-form').submit();
        });
    });

})(jQuery);