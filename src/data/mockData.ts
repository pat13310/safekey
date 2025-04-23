import { KeyData } from '../components/KeyTable';

// Generate random API keys
const generateApiKey = (length: number = 32): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Mock data for API keys
export const mockKeys: KeyData[] = [
  {
    id: '1',
    name: 'Base de données MongoDB',
    key: generateApiKey(),
    project: 'Site e-commerce',
    expirationDate: '15/12/2024',
  },
  {
    id: '2',
    name: 'Stripe Payments',
    key: generateApiKey(),
    project: 'Site e-commerce',
    expirationDate: '01/06/2024',
  },
  {
    id: '3',
    name: 'Google Maps',
    key: generateApiKey(),
    project: 'Application mobile',
    expirationDate: '30/09/2023',
  },
  {
    id: '4',
    name: 'AWS S3 Storage',
    key: generateApiKey(),
    project: 'API interne',
    expirationDate: '22/03/2025',
  },
  {
    id: '5',
    name: 'SendGrid Email',
    key: generateApiKey(),
    project: 'Site e-commerce',
    expirationDate: '10/08/2024',
  },
  {
    id: '6',
    name: 'OpenAI API',
    key: generateApiKey(),
    project: 'Application mobile',
    expirationDate: '05/04/2024',
  },
  {
    id: '7',
    name: 'Twilio SMS',
    key: generateApiKey(),
    project: 'API interne',
    expirationDate: '18/11/2023',
  },
  {
    id: '8',
    name: 'Cloudinary Media',
    key: generateApiKey(),
    project: 'Site e-commerce',
    expirationDate: '30/07/2025',
  },
];