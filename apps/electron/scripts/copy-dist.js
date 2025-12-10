const fs = require('fs-extra');
const path = require('path');

const PROJECT_ROOT = __dirname + '/..';
const distSrc = path.join(PROJECT_ROOT, 'renderer', 'dist');
const distDest = path.join(
  PROJECT_ROOT,
  'dist-electron',
  'win-unpacked',
  'resources',
  'app',
  'renderer',
  'dist'
);

async function main() {
  if (!fs.existsSync(distSrc)) {
    console.error('❌ Không tìm thấy thư mục renderer/dist, hãy chạy pnpm build trước.');
    process.exit(1);
  }

  console.log('🧹 Xoá dist cũ:', distDest);
  await fs.remove(distDest);

  console.log('📦 Copy dist mới tới:', distDest);
  await fs.copy(distSrc, distDest);

  console.log('✅ Copy xong!');
}

main().catch((error) => {
  console.error('❌ Copy thất bại:', error);
  process.exit(1);
});

