// ==UserScript==
// @name         YouTube Link Preview in Twitch
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Show YouTube link preview in Twitch chat when hovering over the link.
// @author       Moore
// @match        https://www.twitch.tv/popout/*/chat?display*
// @match        https://www.twitch.tv/*
// @icon         none
// @grant        none
// ==/UserScript==

(function() {
    let isOnLink = false;
    let previewWindow = null;
    let isPreviewWindowCreated = false;
    let isYouTubeLink = false;

    // 定義 mouseover 事件處理程序
    function overHandler(target) {
        isOnLink = true;

        // 檢查鼠標是否正在移動到元素的子元素上
        const isChildElement = target !== event.relatedTarget && target.contains(event.relatedTarget);

        if (!isChildElement && !isPreviewWindowCreated) {
            previewWindow = createPreviewWindow(getYouTubeVideoId(target.href));

            const rect = target.getBoundingClientRect();
            const windowHeight = window.innerHeight; // 取得視窗高度
            const windowWidth = window.innerWidth; // 取得視窗寬度

            const previewHeight = 300; // 預覽視窗高度
            const previewWidth = 300; // 預覽視窗寬度

            let topPosition = rect.top - previewHeight; // 預覽視窗頂部位置
            let leftPosition = rect.left; // 預覽視窗左側位置

            // 如果預覽視窗頂部超出視窗可見範圍，顯示在超連結下方
            if (rect.top < previewHeight) {
                topPosition = rect.bottom;
            }

            // 如果預覽視窗右側超出視窗可見範圍，調整左側位置
            /*if (rect.right + previewWidth > windowWidth) {
                leftPosition = rect.right - previewWidth;
            }*/

            previewWindow.style.top = topPosition + 'px';
            previewWindow.style.left = leftPosition + 'px';

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
        if (isOnLink && previewWindow && document.body.contains(previewWindow) && isPreviewWindowCreated) {
            isOnLink = false;
            document.body.removeChild(previewWindow);
            previewWindow = null;
            isPreviewWindowCreated = false;
            isYouTubeLink = false;
            target.removeEventListener('mouseout', outHandler);
        }
    }

    // 在頁面完全加載後執行代碼
    window.addEventListener('load', function() {
        const body = document.body;

        // 使用事件委派，將事件監聽器註冊在更靜態的父元素上
        body.addEventListener('mouseover', function(event) {
            const target = event.target;
            isYouTubeLink = isYouTubeURL(target.href);
            const isLink = target.tagName === 'A' && isYouTubeLink;

            if (isLink) {
                overHandler(target);
            } else {
                outHandler(target);
            }
        });
    });

    // 判斷是否為 YouTube 網址
    function isYouTubeURL(url) {
        return url.includes('youtube.com') || url.includes('youtu.be');
    }

    // 從YouTube URL中提取視頻ID
    function getYouTubeVideoId(url) {
        if (url.includes('youtube.com')) {
            const match = url.match(/[?&]v=([^&]+)/);
            return match && match[1];
        } else if (url.includes('youtu.be')) {
            const match = url.match(/youtu\.be\/([^?]+)/);
            return match && match[1];
        }
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
        if(isYouTubeLink) {
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
        }

        return previewWindow;
    }
})();
