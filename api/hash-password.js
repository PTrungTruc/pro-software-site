const bcrypt = require('bcryptjs');
const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Nhập mật khẩu bạn muốn mã hóa: ', (password) => {
  if (!password) { console.log('Mật khẩu không được để trống.'); rl.close(); return; }
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  console.log(`\nPassword Hash:\n${hash}\n\n=> Copy và dán vào file "data/users.json".`);
  rl.close();
});