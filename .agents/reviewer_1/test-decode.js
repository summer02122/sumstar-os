const chunks = [
  new Uint8Array([224]), // First byte of Thai character 'ก' (E0 B8 81)
  new Uint8Array([184, 129]) // Second and third byte
];

let textBad = '';
for (const chunk of chunks) {
  textBad += new TextDecoder().decode(chunk, { stream: true });
}
textBad += new TextDecoder().decode();

const decoder = new TextDecoder();
let textGood = '';
for (const chunk of chunks) {
  textGood += decoder.decode(chunk, { stream: true });
}
textGood += decoder.decode();

console.log('Bad:', textBad);
console.log('Good:', textGood);
