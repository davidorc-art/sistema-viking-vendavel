/**
 * Utility to generate a static Pix payload (BRCode)
 */

export function generatePixPayload(key: string, name: string, city: string, amount: number, transactionId: string = '***') {
  const pad = (str: string) => str.padStart(2, '0');
  
  const sections: Record<string, string> = {
    '00': '01', // Payload Format Indicator
    '26': `0014br.gov.bcb.pix01${pad(key.length.toString())}${key}`, // Merchant Account Information
    '52': '0000', // Merchant Category Code
    '53': '986', // Transaction Currency (BRL)
    '54': amount.toFixed(2), // Transaction Amount
    '58': 'BR', // Country Code
    '59': name.substring(0, 25), // Merchant Name
    '60': city.substring(0, 15), // Merchant City
    '62': `05${pad(transactionId.length.toString())}${transactionId}` // Additional Data Field (Transaction ID)
  };

  let payload = '';
  Object.entries(sections).forEach(([id, value]) => {
    payload += `${id}${pad(value.length.toString())}${value}`;
  });

  payload += '6304'; // CRC16 indicator

  // CRC16 Calculation (CCITT-FALSE)
  function crc16(data: string) {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < data.length; i++) {
      let b = data.charCodeAt(i);
      for (let j = 0; j < 8; j++) {
        let bit = ((b >> (7 - j)) & 1) === 1;
        let c15 = ((crc >> 15) & 1) === 1;
        crc <<= 1;
        if (c15 !== bit) crc ^= polynomial;
      }
    }

    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
  }

  return payload + crc16(payload);
}
