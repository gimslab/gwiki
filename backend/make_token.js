const jwt = require('jsonwebtoken');
const token = jwt.sign({ username: 'gim' }, 'dev-secret-key', { expiresIn: '1d' });
console.log(token);
