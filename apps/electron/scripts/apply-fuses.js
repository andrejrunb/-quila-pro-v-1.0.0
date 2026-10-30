const { flipFuses, FuseVersion, FuseV1Options } = require('@electron/fuses');
const path = require('path');
const fs = require('fs');

exports.default = async function(context) {
  const { appOutDir, packager, electronPlatformName } = context;
  const ext = electronPlatformName === 'win32' ? '.exe' : '';
  const exeName = packager.appInfo.productFilename || 'Áquila Pro';
  const exePath = path.join(appOutDir, `${exeName}${ext}`);

  console.log(`🔒 [FUSES] Aplicando Electron Fuses oficiais em: ${exePath}`);

  if (!fs.existsSync(exePath)) {
    const files = fs.readdirSync(appOutDir);
    const candidate = files.find(f => f.endsWith(ext) && !f.toLowerCase().includes('uninstall'));
    if (candidate) {
      await applyTo(path.join(appOutDir, candidate));
    } else {
      console.warn(`⚠️ [FUSES] Nenhum binário compatível encontrado em ${appOutDir}`);
    }
  } else {
    await applyTo(exePath);
  }
};

async function applyTo(targetPath) {
  try {
    await flipFuses(targetPath, {
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    });
    console.log('✅ [FUSES] Electron Fuses gravados com sucesso no binário nativo!');
  } catch (err) {
    console.error('❌ [FUSES] Falha ao gravar Fuses no binário:', err.message);
    throw err;
  }
}
