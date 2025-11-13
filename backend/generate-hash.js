// generate-hash.js
const bcrypt = require('bcrypt');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter new password: ', (password) => {
  const hash = bcrypt.hashSync(password, 10);
  console.log('Generated Hash:', hash);
  rl.close();
});
