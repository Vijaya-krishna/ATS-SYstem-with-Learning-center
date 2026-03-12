const pdf = require('pdf-parse');
console.log('Keys:', Object.keys(pdf));
if (pdf.default) {
  console.log('Has default export, type:', typeof pdf.default);
}
if (pdf.parse) {
  console.log('Has parse export, type:', typeof pdf.parse);
}
