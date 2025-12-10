const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const pkgJsonPath = path.join(PROJECT_ROOT, 'package.json');

if (process.env.SKIP_VERSION_BUMP === 'true') {
  console.log('🔁 Bỏ qua bước tăng version (SKIP_VERSION_BUMP=true)');
  process.exit(0);
}

function bumpPatch(version) {
  if (typeof version !== 'string') {
    throw new Error('Version trong package.json không hợp lệ');
  }
  const parts = version.split('.');
  if (parts.length < 3) {
    throw new Error(`Version "${version}" không ở dạng x.y.z`);
  }
  parts[2] = String(Number(parts[2]) + 1);
  return parts.join('.');
}

const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const oldVersion = pkgJson.version;
const newVersion = bumpPatch(oldVersion);

pkgJson.version = newVersion;
fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');

console.log(`🔢 Version tăng từ ${oldVersion} ➜ ${newVersion}`);

