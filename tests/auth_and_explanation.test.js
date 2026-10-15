require('dotenv').config();
const test = require('node:test');
const assert = require('node:assert');
const { signToken, verifyToken } = require('../src/utils/tokenUtils');
const ExplanationService = require('../src/services/explanationService');

test('Authentication Token Utils', async (t) => {
  await t.test('signToken should generate a valid JWT that decodes accurately', () => {
    const payload = { id: 'user_123', role: 'admin' };
    const token = signToken(payload, 'test_secret', '1h');
    assert.ok(token);
    assert.strictEqual(typeof token, 'string');

    const decoded = verifyToken(token, 'test_secret');
    assert.strictEqual(decoded.id, 'user_123');
    assert.strictEqual(decoded.role, 'admin');
  });

  await t.test('verifyToken should throw an error on invalid signature', () => {
    const payload = { id: 'user_123', role: 'admin' };
    const token = signToken(payload, 'secret_a', '1h');

    assert.throws(() => {
      verifyToken(token, 'wrong_secret');
    });
  });
});

test('Project Explanation Password Verification Feature', async (t) => {
  await t.test('verifyPassword should succeed with correct password "Shiv@818780"', () => {
    const result = ExplanationService.verifyPassword('Shiv@818780');
    assert.strictEqual(result.verified, true);
    assert.ok(result.token, 'Should return signed explanation token');

    const content = ExplanationService.getExplanationContent(result.token);
    assert.ok(content.title);
    assert.ok(content.techStack);
    assert.ok(content.rolesAndPermissions);
  });

  await t.test('verifyPassword should reject incorrect password and throw ApiError', () => {
    assert.throws(() => {
      ExplanationService.verifyPassword('WrongPassword123');
    }, (err) => {
      return err.statusCode === 401;
    });
  });

  await t.test('getExplanationContent should reject missing or invalid token', () => {
    assert.throws(() => {
      ExplanationService.getExplanationContent(null);
    }, (err) => {
      return err.statusCode === 403;
    });

    assert.throws(() => {
      ExplanationService.getExplanationContent('invalid.jwt.token');
    }, (err) => {
      return err.statusCode === 403;
    });
  });
});
