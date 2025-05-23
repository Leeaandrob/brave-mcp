import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export interface Config {
  port: number;
  braveApiKey: string;
  braveApiUrl: string;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  braveApiKey: process.env.BRAVE_API_KEY || '',
  braveApiUrl: 'https://api.search.brave.com/res/v1',
};

// Check if the API key is defined in the environment
console.log('Environment variables loaded:');
console.log('- PORT:', process.env.PORT || '3000 (default)');
console.log('- BRAVE_API_KEY:', process.env.BRAVE_API_KEY ? 'Defined' : 'Not defined');

// Validate required configuration
if (!config.braveApiKey) {
  console.warn('Warning: The BRAVE_API_KEY environment variable is not defined');
  console.warn('Searches will return example data instead of real results');
  console.warn('Get an API key at https://brave.com/search/api/');
} else if (config.braveApiKey === 'your_api_key_here') {
  console.warn('Warning: You are using the default value for BRAVE_API_KEY');
  console.warn('Please update the .env file with your real API key');
  console.warn('Get an API key at https://brave.com/search/api/');
  // Don't set to empty to allow API usage attempts
}

export default config;
