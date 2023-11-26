// ==UserScript==
// @name         Twitch YouTube Link Preview
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Show YouTube link preview in Twitch chat when hovering over the link.
// @author       Moore
// @match        https://www.twitch.tv/popout/*/chat?display*
// @match        https://www.twitch.tv/*
// @icon         none
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let isOnLink = false;
    let previewWindow = null;
    let isPreviewWindowCreated = false;

    // 定義 mouseover 事件處理程序
    function overHandler(target) {
        isOnLink = true;

        if (!isPreviewWindowCreated) {
            previewWindow = createPreviewWindow(getYouTubeVideoId(target.href));

            const rect = target.getBoundingClientRect();
            previewWindow.style.top = rect.bottom + 'px';
            previewWindow.style.left = rect.left + 'px';

            document.body.appendChild(previewWindow);
            isPreviewWindowCreated = true;

            // 在 mouseout 事件中處理
            target.addEventListener('mouseout', function() {
                outHandler(target);
            });
        }
    }

    // 定義 mouseout 事件處理程序
    function outHandler(target) {
        if (isOnLink && previewWindow && document.body.contains(previewWindow)) {
            isOnLink = false;
            document.body.removeChild(previewWindow);
            previewWindow = null;
            isPreviewWindowCreated = false;
            target.removeEventListener('mouseout', outHandler);
        }
    }

    // 在頁面完全加載後執行代碼
    window.addEventListener('load', function() {
        const body = document.body;

        // 使用事件委派，將事件監聽器註冊在更靜態的父元素上
        body.addEventListener('mouseover', function(event) {
            const target = event.target;
            const isLink = target.tagName === 'A' && target.href.includes('youtube.com');

            if (isLink) {
                overHandler(target);
            } else {
                outHandler(target);
            }
        });
    });

    // 從YouTube URL中提取視頻ID
    function getYouTubeVideoId(url) {
        const match = url.match(/[?&]v=([^&]+)/);
        return match && match[1];
    }

    function createPreviewWindow(videoId) {
        const previewWindow = document.createElement('div');
        previewWindow.style.position = 'fixed';
        previewWindow.style.zIndex = '9999';
        previewWindow.style.width = '300px';
        previewWindow.style.padding = '10px';
        previewWindow.style.background = '#fff';
        previewWindow.style.border = '1px solid #ccc';
        previewWindow.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';

        // 顯示 YouTube 影片標題
        const titleElement = document.createElement('div');
        titleElement.style.fontSize = '16px'; // 設置字體大小
        titleElement.style.fontWeight = 'bold'; // 設置字體粗細
        titleElement.style.color = 'black'; // 設置文字顏色為黑色
        titleElement.textContent = '載入中...'; // 初始訊息
        previewWindow.appendChild(titleElement);

        // 使用 oEmbed API 獲取影片詳細資訊
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
            .then(response => response.json())
            .then(data => {
            // 更新標題為實際影片標題
            titleElement.textContent = data.title;

            // 嘗試獲取不同品質的預覽圖片
            const thumbnailElement = document.createElement('img');
            thumbnailElement.src = data.thumbnail_url;

            thumbnailElement.onerror = function () {
                // 如果預覽圖片載入失敗，顯示一個預設的圖片或其他處理方式
                thumbnailElement.src = 'https://example.com/default-image.jpg'; // 請替換成你的預設圖片 URL
            };

            previewWindow.appendChild(thumbnailElement);
        }).catch(error => {
            console.error('Error fetching YouTube data:', error);
            titleElement.textContent = '無法獲取影片標題';
        });

        return previewWindow;
    }
})();
