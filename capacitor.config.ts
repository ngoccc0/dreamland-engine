import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.dreamlandengine',
  appName: 'Dreamland Engine',
  webDir: '.next',
  server: {
    url: 'https://dreamland-engine.netlify.app'
  }
};

export default config;
