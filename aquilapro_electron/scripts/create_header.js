const sharp = require('sharp');
const path = require('path');

async function createHeader() {
  const logoPath = 'c:/aquila/aquilapro_electron/src/assets/logo.png';
  const outputPath = 'c:/aquila/aquilapro_electron/resources/installerHeader.png';
  
  try {
    // Carregar a logo
    const logoMetadata = await sharp(logoPath).metadata();
    
    // Redimensionar logo para altura de 48px (mantendo proporção)
    const logoHeight = 48;
    const logo = await sharp(logoPath)
      .resize({ height: logoHeight })
      .toBuffer();

    // Criar fundo branco 450x57 (tamanho padrão NSIS header)
    // Usaremos canal alpha para transparência se necessário, mas o NSIS prefere bitmap/png sólido para o header.
    await sharp({
      create: {
        width: 450,
        height: 57,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
      .composite([{ input: logo, gravity: 'center' }])
      .png()
      .toFile(outputPath);
      
    console.log('Header do instalador gerado com sucesso em:', outputPath);
  } catch (err) {
    console.error('Erro ao gerar header:', err);
    process.exit(1);
  }
}

createHeader();
