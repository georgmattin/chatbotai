const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function makeRequest(text) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      messages: [
        {
          role: 'user',
          content: `Please rewrite this text in English using different words while keeping the same meaning and length: "${text}"`
        }
      ],
      max_completion_tokens: Math.min(4000, text.length * 2)
    });

    const options = {
      hostname: 'ai-info-6718.cognitiveservices.azure.com',
      port: 443,
      path: '/openai/deployments/o1/chat/completions?api-version=2025-01-01-preview',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': '5tGeGFBcRk3gB8qgyoCBk5MdK5qAztjbWIIs3lpOt9CvSz7WrkuFJQQJ99BEAC5RqLJXJ3w3AAAAACOGKxoN',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🚀 Saadan O1 API-le: ${text.length} tähemärki`);
    console.log('⏳ Ootan vastust...\n');

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      console.log(`⏱️  Vastus saadud ${duration.toFixed(1)} sekundiga`);
      console.log(`📡 Status: ${res.statusCode}`);

      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            console.error('❌ API Error:', res.statusCode, data);
            reject(new Error(`API Error: ${res.statusCode}`));
            return;
          }

          const response = JSON.parse(data);
          
          if (response.choices && response.choices[0] && response.choices[0].message) {
            const result = response.choices[0].message.content;
            console.log('\n✅ O1 VASTUS:');
            console.log('='.repeat(50));
            console.log(result);
            console.log('='.repeat(50));
            console.log(`\n📊 Statistika:`);
            console.log(`   Algne: ${text.length} tähemärki`);
            console.log(`   Uus: ${result.length} tähemärki`);
            console.log(`   Erinevus: ${result.length - text.length}`);
            console.log(`   Säilitatud: ${((result.length / text.length) * 100).toFixed(1)}%`);
            resolve(result);
          } else {
            console.error('❌ Vigane vastuse formaat:', response);
            reject(new Error('Invalid response format'));
          }
        } catch (error) {
          console.error('❌ JSON parse error:', error.message);
          console.error('❌ Raw response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      console.error('❌ Error code:', error.code);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('❌ Request timeout!');
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Set timeout to 60 seconds
    req.setTimeout(60000);

    req.write(postData);
    req.end();
  });
}

console.log('🧪 O1 API Test Skript (Native HTTPS)');
console.log('Sisesta tekst, mida tahad ümber kirjutada:');

rl.question('Tekst: ', async (input) => {
  if (input.trim()) {
    try {
      await makeRequest(input.trim());
    } catch (error) {
      console.error('❌ Test ebaõnnestus:', error.message);
    }
  } else {
    console.log('❌ Tühi sisend!');
  }
  
  rl.close();
}); 