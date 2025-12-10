// Script to load .env file and run electron-builder
require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

// Get command line arguments (everything after the script name)
const args = process.argv.slice(2);

// Check if GH_TOKEN is set
if (!process.env.GH_TOKEN || process.env.GH_TOKEN === 'your_github_token_here') {
  console.error('❌ GH_TOKEN chưa được set!');
  console.error('Vui lòng:');
  console.error('1. Tạo file .env trong thư mục project');
  console.error('2. Thêm dòng: GH_TOKEN=your_actual_token');
  console.error('Xem file AUTO_UPDATE_SETUP.md để biết cách lấy token');
  process.exit(1);
}

console.log('✅ GH_TOKEN đã được load từ file .env');
console.log('🔨 Bắt đầu build...\n');

// Run electron-builder with publish flag if not specified
const builderArgs = args.length > 0 ? args : ['--publish', 'always'];

// Run electron-builder with all arguments
const electronBuilder = spawn('electron-builder', builderArgs, {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  },
});

electronBuilder.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Build thành công!');
  } else {
    console.error(`\n❌ Build thất bại với code: ${code}`);
    process.exit(code);
  }
});

electronBuilder.on('error', (err) => {
  console.error('❌ Lỗi khi chạy electron-builder:', err);
  process.exit(1);
});

