/**
 * FootCare Clinic Chatbot Widget (Updated for Mobile/Desktop Responsiveness)
 */

(function () {
  let config = {
    botName: 'Fiona',
    clinicLocation: 'all',
    allowImageUpload: true,
    theme: 'teal',
    position: 'right'
  };

  const createStyles = () => {
    const styleEl = document.createElement('style');
    styleEl.id = 'fc-chat-styles';
    styleEl.innerHTML = `
      #fc-chat-widget-button {
        position: fixed;
        bottom: 20px;
        ${config.position === 'right' ? 'right' : 'left'}: 20px;
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background-color: ${config.theme === 'teal' ? '#00847e' : '#4CAF50'};
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 9998;
        border: none;
      }

      #fc-chat-widget-button img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }

      #fc-chat-widget-container {
        position: fixed;
        ${config.position === 'right' ? 'right' : 'left'}: 20px;
        bottom: 100px;
        width: 350px;
        height: 500px;
        background-color: white;
        border-radius: 10px;
        box-shadow: 0 5px 40px rgba(0, 0, 0, 0.16);
        z-index: 9999;
        overflow: hidden;
        display: none;
        flex-direction: column;
        transition: all 0.3s ease;
      }

      @media (max-width: 767px) {
        #fc-chat-widget-button {
          left: 50%;
          transform: translateX(-50%);
        }
        #fc-chat-widget-container {
          left: 0;
          right: 0;
          bottom: 0;
          top: 0;
          width: 100vw;
          height: 100vh;
          border-radius: 0;
        }
      }

      #fc-chat-widget-header {
        background-color: ${config.theme === 'teal' ? '#00847e' : '#4CAF50'};
        color: white;
        padding: 10px 15px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      #fc-chat-widget-header h3 {
        margin: 0;
        font-size: 16px;
      }

      #fc-chat-widget-close {
        background: none;
        border: none;
        color: white;
        font-size: 22px;
        cursor: pointer;
      }

      #fc-chat-widget-iframe {
        flex: 1;
        border: none;
        width: 100%;
        height: 100%;
      }
    `;
    document.head.appendChild(styleEl);
  };

  const createChatButton = () => {
    const button = document.createElement('button');

    // Fetch dynamic button label
    const getButtonLabel = async () => {
      try {
        const response = await fetch('/api/chatbot-settings');
        if (response.ok) {
          const settings = await response.json();
          return settings.ctaButtonLabel || '💬 Ask Niamh';
        }
      } catch (error) {
        console.warn('Failed to fetch button label, using default');
      }
      return '💬 Ask Niamh';
    };

    getButtonLabel().then(label => {
      button.innerHTML = label;
    });

    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      ${config.position === 'right' ? 'right' : 'left'}: 20px;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      background-color: ${config.theme === 'teal' ? '#00847e' : '#4CAF50'};
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 9998;
      border: none;
    `;
    button.onclick = toggleChatWidget;
    document.body.appendChild(button);
  };

  const createChatContainer = () => {
    const container = document.createElement('div');
    container.id = 'fc-chat-widget-container';

    const header = document.createElement('div');
    header.id = 'fc-chat-widget-header';
    header.innerHTML = `
      <h3>${config.botName}</h3>
      <button id="fc-chat-widget-close" aria-label="Close chat">&times;</button>
    `;

    const iframe = document.createElement('iframe');
    iframe.id = 'fc-chat-widget-iframe';
    const src = new URL('/chat', window.location.origin);
    src.searchParams.append('embedded', 'true');
    src.searchParams.append('botName', config.botName);
    src.searchParams.append('clinicLocation', config.clinicLocation);
    src.searchParams.append('allowImageUpload', config.allowImageUpload);
    src.searchParams.append('theme', config.theme);
    iframe.src = src.toString();

    header.querySelector('#fc-chat-widget-close').onclick = toggleChatWidget;

    container.appendChild(header);
    container.appendChild(iframe);
    document.body.appendChild(container);
  };

  const toggleChatWidget = () => {
    const widget = document.getElementById('fc-chat-widget-container');
    if (widget.style.display === 'none' || widget.style.display === '') {
      widget.style.display = 'flex';
    } else {
      widget.style.display = 'none';
    }
  };

  window.fcChat = function (action, options) {
    if (action === 'init') {
      config = { ...config, ...options };
      createStyles();
      setTimeout(() => {
        createChatButton();
        createChatContainer();
      }, 1000);
    }
  };

  if (window.fcChat.q) {
    for (const args of window.fcChat.q) {
      window.fcChat(args[0], args[1]);
    }
  }
})();