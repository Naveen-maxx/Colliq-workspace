const https = require('https');

https.get('https://raw.githubusercontent.com/mathiasbynens/small/master/jpeg.jpg', (res) => {
  const data = [];
  res.on('data', (chunk) => data.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(data);
    const base64 = buffer.toString('base64');
    console.log("data:image/jpeg;base64," + base64);
  });
}).on('error', (e) => {
  console.error(e);
});
