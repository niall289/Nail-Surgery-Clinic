# FootCare Clinic Chatbot Web Embedding Solution

This document provides an overview of the website embedding solution created for the FootCare Clinic chatbot.

## Overview

We've developed a professional JavaScript widget that can be easily embedded on any website. This solution has the following features:

- **Professional appearance** matching the FootCare Clinic branding
- **Responsive design** that works on both desktop and mobile devices
- **Customizable configuration** including clinic location, theme, and positioning
- **Performance optimized** with minimal impact on website loading time
- **User-friendly interface** with smooth animations and transitions
- **Cross-browser compatibility** for all modern browsers

## Files Overview

1. **widget.js** - The main JavaScript widget file that creates the chat interface
2. **example-embed.html** - Example HTML page showing the widget in action
3. **chatbot-integration-guide.md** - Comprehensive guide for the website team

## Key Features

### Professional Design
The chatbot widget features a clean, professional design with:
- Teal color scheme matching the FootCare Clinic brand
- Smooth animations and transitions
- Proper spacing and layout on all devices

### Responsive Layout
The widget automatically adapts to different screen sizes:
- On desktop: Fixed in the bottom-right corner
- On mobile: Centered at the bottom of the screen with optimized size

### Smart Behavior
User-friendly features include:
- Subtle entrance animation to avoid distracting users
- Inactive timeout to minimize after 5 minutes of inactivity
- Remembers open/closed state between page views
- Seamless iframe integration with the main chatbot interface

### Easy Customization
The widget can be customized with simple configuration options:
- Pre-select a clinic location for specific pages
- Change the bot name for different contexts
- Adjust positioning (left/right)
- Toggle image upload functionality

### WordPress Integration
Detailed instructions for WordPress integration:
- Both direct theme editing and plugin-based approaches
- Page-specific configuration options
- Simple code snippets for the website team

## Integration Methods

### Simple iframe Embed
For basic integration, a simple iframe can be used to embed the chatbot:

```html
<iframe 
  src="https://your-hosted-chatbot-url.com/chat" 
  style="position: fixed; bottom: 20px; right: 20px; width: 350px; height: 500px; border: none; z-index: 9999; border-radius: 10px; box-shadow: 0 5px 40px rgba(0,0,0,0.16);" 
  id="footcare-chatbot">
</iframe>
```

### JavaScript Widget (Recommended)
For a more professional solution, the JavaScript widget provides better integration:

```html
<script>
  (function(w,d,s,o,f,js,fjs){
    w['FootCareWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','fcChat','https://your-hosted-chatbot-url.com/widget.js'));
  fcChat('init', { 
    botName: 'Fiona',
    clinicLocation: 'all',
    allowImageUpload: true,
    theme: 'teal'
  });
</script>
```

## Testing the Integration

You can test the chatbot widget locally by accessing:
```
http://localhost:5000/example-embed.html
```

This example page shows the widget embedded in a sample website layout.

## Deployment Considerations

When deploying to production:

1. **Hosting:** Host the widget.js file on the same domain as the chatbot to avoid CORS issues
2. **Performance:** The widget is designed to load asynchronously to minimize impact on page load
3. **Security:** The widget uses secure localStorage for state management
4. **Accessibility:** Full keyboard navigation and ARIA attributes are included

## Documentation

Detailed documentation is provided in the `chatbot-integration-guide.md` file, including:

- Step-by-step integration instructions
- WordPress-specific integration steps
- Cliniko integration suggestions
- Customization options
- Recommended layout guidelines
- Troubleshooting tips
  