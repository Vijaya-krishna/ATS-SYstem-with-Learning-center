const fs = require('fs');
const pdf = require('pdf-parse');

console.log('--- TEST SCRIPT ---');
console.log('pdf export type:', typeof pdf);

if (typeof pdf === 'function') {
  console.log('pdf is a function');
} else {
  console.log('keys:', Object.keys(pdf));
  if (pdf.default) {
    console.log('has default, type:', typeof pdf.default);
  }
}
