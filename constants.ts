// URLs apuntando al repositorio 'web2' donde los archivos existen.
// Para una solución permanente, el usuario debe subir estos archivos al nuevo repositorio ('DA-itd-web')
// y actualizar estas URLs para que apunten a él.
export const DATABASE_URL = 'https://raw.githubusercontent.com/DA-itd/web2/main/database.xlsx';
export const ITD_LOGO_URL = 'https://raw.githubusercontent.com/DA-itd/web2/main/image.jpg';
export const TECNM_LOGO_URL = 'https://raw.githubusercontent.com/DA-itd/web2/main/TecNM_logo.jpg';

// Nombres de columna que podrían contener el folio en el archivo Excel.
// El sistema buscará una columna con alguno de estos nombres (ignorando mayúsculas/minúsculas y espacios).
export const POTENTIAL_FOLIO_HEADERS = [
    'Folio',
    'ID',
    'Folio del certificado',
    'Folio de la constancia',
    'No. de Folio',
    '# Folio',
    'folio'
];