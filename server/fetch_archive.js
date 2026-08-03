const http = require('http');

http.get('http://localhost:3000/api/v1/partners/archived/list', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const ag = list.find(p => p.name === 'AGESCO S.L.');
    console.log(JSON.stringify(ag, null, 2));
  });
}).on('error', err => console.log('Error: ', err.message));
