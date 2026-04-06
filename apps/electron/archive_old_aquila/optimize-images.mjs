#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../client/public');
const staticAssetsDir = path.join(__dirname, '../../webdev-static-assets');

const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];

async function optimizeImage(inputPath, outputDir) {
  try {
    const filename = path.basename(inputPath);
    const nameWithoutExt = path.parse(filename).name;

    // Otimizar para WebP
    const webpPath = path.join(outputDir, `${nameWithoutExt}.webp`);
    await sharp(inputPath)
      .webp({ quality: 80 })
      .toFile(webpPath);

    console.log(`✓ WebP criado: ${webpPath}`);

    // Otimizar original
    const ext = path.extname(inputPath).toLowerCase();
    if (ext === '.png') {
      await sharp(inputPath)
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(inputPath);
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      await sharp(inputPath)
        .jpeg({ quality: 80, progressive: true })
        .toFile(inputPath);
    }

    console.log(`✓ Original otimizado: ${inputPath}`);
  } catch (error) {
    console.error(`✗ Erro ao otimizar ${inputPath}:`, error.message);
  }
}

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Diretório não encontrado: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const ext = path.extname(file).toLowerCase();

    if (imageExtensions.includes(ext)) {
      console.log(`Otimizando: ${file}`);
      await optimizeImage(filePath, dir);
    }
  }
}

async function main() {
  console.log('🖼️  Iniciando otimização de imagens...\n');

  console.log('📁 Processando assets estáticos...');
  await processDirectory(staticAssetsDir);

  console.log('\n📁 Processando assets públicos...');
  await processDirectory(assetsDir);

  console.log('\n✅ Otimização concluída!');
}

main().catch(console.error);
