const codec = require('../src/codec');

const assert = require('assert');

describe('Accumulate player command', () => {
  describe('Accumulate from empty', () => {
    let received = "";
    it('should be equals to data', () => {
      data = new ArrayBuffer(5);
      data[0] = 'p';
      data[1] = '1';
      data[2] = 'u';
      data[3] = 'u';
      data[4] = '\n';

      received = codec.accumulatePlayerCommand(received, data);

      assert.equal(new ArrayBuffer('p1uu\n'), received);
    });

    it('Accumulate from empty, with errorneous data', () => {

    });
  });
});
