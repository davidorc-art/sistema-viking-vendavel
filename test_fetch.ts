async function testFetch() {
  const urls = [
    'https://ais-pre-2tbowewzusbqf6dnvcjq6n-79836564543.us-east1.run.app/api/ping',
    'https://ais-pre-2tbowewzusbqf6dnvcjq6n-79836564543.us-east1.run.app/api/calendar/feed',
  ];
  
  for (const url of urls) {
    try {
      console.log(`\nTesting URL: ${url}`);
      const res = await fetch(url);
      console.log('Status:', res.status);
      console.log('Content-Type:', res.headers.get('content-type'));
      const text = await res.text();
      console.log('Body start:', text.substring(0, 100).replace(/\n/g, ' '));
    } catch (e) {
      console.error(e);
    }
  }
}
testFetch();
