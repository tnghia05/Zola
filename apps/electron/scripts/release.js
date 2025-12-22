const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const pkgJsonPath = path.join(PROJECT_ROOT, 'package.json');

// Lấy type từ command line: patch, minor, major (mặc định là patch)
const versionType = process.argv[2] || 'patch';

function bumpVersion(version, type) {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0] += 1;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1] += 1;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2] += 1;
      break;
  }
  
  return parts.join('.');
}

// Đọc package.json
const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
const oldVersion = pkgJson.version;
const newVersion = bumpVersion(oldVersion, versionType);

// Cập nhật version
pkgJson.version = newVersion;
fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');

console.log(`🔢 Version tăng từ ${oldVersion} ➜ ${newVersion}`);

// Commit version mới
const tagName = `v${newVersion}`;
try {
  execSync('git add apps/electron/package.json', { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  execSync(`git push origin main`, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  
  // Tạo tag và push
  execSync(`git tag ${tagName}`, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  execSync(`git push origin ${tagName}`, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  
  console.log(`✅ Đã tạo release ${tagName} và push lên GitHub!`);
  console.log(`🚀 GitHub Actions sẽ tự động build và publish file .exe`);
} catch (error) {
  console.error('❌ Lỗi khi release:', error.message);
  process.exit(1);
}

