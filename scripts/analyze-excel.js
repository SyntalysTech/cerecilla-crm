const XLSX = require('xlsx');
const path = require('path');

// Read clientes file
const clientesPath = path.join(__dirname, '../datos-crm-antiguo/clientes - 2025-12-19T011602.029_Ultimos_4_meses.xlsx');
const clientesWorkbook = XLSX.readFile(clientesPath);

console.log('=== CLIENTES FILE ===');
console.log('Sheets:', clientesWorkbook.SheetNames);

clientesWorkbook.SheetNames.forEach(sheetName => {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = clientesWorkbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length > 0) {
    console.log('Headers:', data[0]);
    console.log('Total rows:', data.length - 1);
    if (data.length > 1) {
      console.log('First data row:', data[1]);
      if (data.length > 2) {
        console.log('Second data row:', data[2]);
      }
    }
  }
});

// Read operarios file
const operariosPath = path.join(__dirname, '../datos-crm-antiguo/operarios.xlsx');
const operariosWorkbook = XLSX.readFile(operariosPath);

console.log('\n\n=== OPERARIOS FILE ===');
console.log('Sheets:', operariosWorkbook.SheetNames);

operariosWorkbook.SheetNames.forEach(sheetName => {
  console.log(`\n--- Sheet: ${sheetName} ---`);
  const sheet = operariosWorkbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (data.length > 0) {
    console.log('Headers:', data[0]);
    console.log('Total rows:', data.length - 1);
    if (data.length > 1) {
      console.log('First data row:', data[1]);
      if (data.length > 2) {
        console.log('Second data row:', data[2]);
      }
    }
  }
});
