import test from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage } from '../src/utils/apiError.js';

test('uses the API error message in preference to Axios status text', () => {
  const error = {
    message: 'Request failed with status code 400',
    response: { data: { success: false, message: 'A credit card with an outstanding balance cannot be deleted' } },
  };

  assert.equal(apiErrorMessage(error, 'Fallback'), 'A credit card with an outstanding balance cannot be deleted');
});

test('falls back safely when the API did not return a message', () => {
  assert.equal(apiErrorMessage(new Error('Network Error'), 'Fallback'), 'Network Error');
  assert.equal(apiErrorMessage(null, 'Fallback'), 'Fallback');
});
