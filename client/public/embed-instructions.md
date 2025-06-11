# 🧠 Embed the FootCare Clinic Chatbot

To embed the chatbot on your website, follow these simple steps:

---

## ✅ 1. Add This Script Tag to Your Website

Paste this **anywhere before the closing `</body>` tag** on your website:

```html
<script src="https://footcareclinic.engageiobots.com/widget.js"></script>
<script>
  window.fcChat = window.fcChat || function () {
    (window.fcChat.q = window.fcChat.q || []).push(arguments);
  };
  window.fcChat('init', {
    botName: 'Fiona',
    clinicLocation: 'all',
    allowImageUpload: true,
    theme: 'teal',
    position: 'right'
  });
</script>
