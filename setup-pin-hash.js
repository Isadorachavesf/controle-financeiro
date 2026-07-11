#!/usr/bin/env node

/**
 * Script para gerar o hash do PIN 0804 usando bcryptjs
 * Use: node setup-pin-hash.js
 */

const bcryptjs = require('bcryptjs');

async function generatePinHash() {
  try {
    const pin = '0804';
    const saltRounds = 10;

    const hash = await bcryptjs.hash(pin, saltRounds);

    console.log('\n✅ PIN Hash gerado com sucesso!\n');
    console.log('PIN: 0804');
    console.log('Hash:', hash);
    console.log('\nCopie o valor acima e adicione ao seu .env.local:');
    console.log(`PIN_HASH=${hash}\n`);

  } catch (error) {
    console.error('❌ Erro ao gerar hash:', error.message);
    process.exit(1);
  }
}

generatePinHash();
