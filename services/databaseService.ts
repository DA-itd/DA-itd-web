import { DATABASE_URL, POTENTIAL_FOLIO_HEADERS } from '../constants';
import { CertificateRecord } from '../types';

declare const window: any;

export const loadDatabase = async (): Promise<CertificateRecord[]> => {
  const cacheBustingUrl = `${DATABASE_URL}?v=${new Date().getTime()}`;
  const response = await fetch(cacheBustingUrl);
  if (!response.ok) throw new Error('No se pudo cargar la base de datos. Verifique que la URL en constants.ts sea correcta.');
  
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Los archivos .xlsx son archivos zip, que comienzan con "PK" (0x50, 0x4B)
  if (data.length < 4 || data[0] !== 0x50 || data[1] !== 0x4B) {
    let errorMessage = 'El archivo descargado no parece ser un archivo Excel (.xlsx) válido. Verifique la DATABASE_URL en constants.ts.';
    try {
        const textContent = new TextDecoder('utf-8').decode(data);
        if (textContent.trim().toLowerCase().includes('<html')) {
            errorMessage = 'La URL de la base de datos devolvió una página HTML en lugar de un archivo Excel. Esto suele ocurrir si la URL es incorrecta y lleva a una página de error (ej. 404 No Encontrado). Por favor, verifique la DATABASE_URL en constants.ts.';
        }
    } catch (e) {
        // No se pudo decodificar como texto, se mantiene el error original.
    }
    throw new Error(errorMessage);
  }

  const workbook = window.XLSX.read(data, { type: 'array' });
  let allData: CertificateRecord[] = [];

  workbook.SheetNames.forEach((sheetName: string) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet || !worksheet['!ref']) return;
    
    const dataAoA = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false });
    if (dataAoA.length === 0) return;

    let headerRowIndex = -1;
    for (let i = 0; i < dataAoA.length; i++) {
      const row = dataAoA[i];
      if (Array.isArray(row) && row.some(cell => {
        const cellVal = String(cell || '').trim().toLowerCase();
        return POTENTIAL_FOLIO_HEADERS.includes(cellVal);
      })) {
        headerRowIndex = i;
        break;
      }
    }
    if (headerRowIndex === -1) return;

    const headers = dataAoA[headerRowIndex].map((h: any) => (h ? String(h).trim() : ''));
    const dataRows = dataAoA.slice(headerRowIndex + 1);

    const sheetJson = dataRows
      .filter((row: any[]) => Array.isArray(row) && row.some(cell => String(cell || '').trim() !== ''))
      .map((row: any[]) => {
        const record: CertificateRecord = {};
        headers.forEach((header: string, i: number) => {
          if (header && i < row.length) record[header] = row[i];
        });
        return record;
      });

    allData = allData.concat(sheetJson);
  });

  return allData;
};