import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './models/User.js';

async function runUnitTests() {
  console.log('=== RUNNING SECURITY & CRYPTOGRAPHY UNIT TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Bcrypt Password Hashing & Salt Rounds
  const password = 'SuperSecretTravelPassword2026!';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  assert(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Bcrypt hash generated with valid format ($2a$ or $2b$)');
  assert(await bcrypt.compare(password, hash) === true, 'Bcrypt compare matches original plaintext password');
  assert(await bcrypt.compare('WrongPassword', hash) === false, 'Bcrypt compare correctly rejects incorrect password');

  // 2. JWT Generation & Signature Verification
  const testUserId = '64f1a2b3c4d5e6f7a8b9c0d1';
  const secret = 'test_jwt_secret_atlas_32_characters_long_key';
  const token = jwt.sign({ id: testUserId }, secret, { expiresIn: '1h' });
  assert(typeof token === 'string' && token.split('.').length === 3, 'JWT is a valid 3-part signed token');

  const decoded = jwt.verify(token, secret);
  assert(decoded.id === testUserId, 'JWT payload extracts user ID accurately');

  // 3. JWT Tamper Resistance
  try {
    jwt.verify(token, 'wrong_secret_key');
    assert(false, 'JWT should reject signature with incorrect secret');
  } catch (err) {
    assert(err.name === 'JsonWebTokenError', 'JWT correctly throws JsonWebTokenError on forged signature');
  }

  // 4. JWT Expiration Rejection
  const expiredToken = jwt.sign({ id: testUserId }, secret, { expiresIn: '-1s' });
  try {
    jwt.verify(expiredToken, secret);
    assert(false, 'JWT should reject expired token');
  } catch (err) {
    assert(err.name === 'TokenExpiredError', 'JWT correctly throws TokenExpiredError on expired token');
  }

  // 5. User Safe Serialization
  const mockUser = new User({
    name: 'Kabir Verma',
    email: 'kabir@smarttravel.com',
    passwordHash: hash,
  });

  const jsonUser = mockUser.toJSON();
  assert(jsonUser.passwordHash === undefined, 'User toJSON explicitly omits passwordHash');
  assert(jsonUser.__v === undefined, 'User toJSON explicitly omits Mongoose __v');
  assert(jsonUser.id !== undefined, 'User toJSON exposes clean id property');
  assert(jsonUser.email === 'kabir@smarttravel.com', 'User toJSON retains normalized email');

  console.log(`\n=== UNIT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runUnitTests();
