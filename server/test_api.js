const http = require('http');

http.get('http://localhost:3000/api/v1/transporters', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const transporters = JSON.parse(data);
    const hasImanov = transporters.find(t => t.name.includes('IMANOV'));
    console.log("Has IMANOV?", hasImanov);
    const hasHanko = transporters.find(t => t.name.includes('HANKÓ'));
    console.log("Has HANKÓ?", hasHanko);
  });
}).on('error', (err) => console.log('Error:', err.message));
