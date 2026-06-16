const http = require('https');
http.get('https://managerhourse-be.onrender.com/api-docs/swagger-ui-init.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const match = data.match(/var options = (\{.*?\});/s);
      if (match) {
        const jsonStr = match[1];
        const swaggerConfig = JSON.parse(jsonStr);
        const paths = swaggerConfig.swaggerDoc.paths;
        const notifPaths = Object.keys(paths).filter(p => p.toLowerCase().includes('notif'));
        console.log("Notification paths:", notifPaths);
      }
    } catch(e) { console.error(e) }
  });
}).on("error", console.error);
