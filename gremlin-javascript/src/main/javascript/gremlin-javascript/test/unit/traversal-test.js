/*
 *  Licensed to the Apache Software Foundation (ASF) under one
 *  or more contributor license agreements.  See the NOTICE file
 *  distributed with this work for additional information
 *  regarding copyright ownership.  The ASF licenses this file
 *  to you under the Apache License, Version 2.0 (the
 *  "License"); you may not use this file except in compliance
 *  with the License.  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing,
 *  software distributed under the License is distributed on an
 *  "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 *  KIND, either express or implied.  See the License for the
 *  specific language governing permissions and limitations
 *  under the License.
 */

/**
 * @author Jorge Bay Gondra
 */
'use strict';

const assert = require('assert');
const expect = require('chai').expect;
const graph = require('../../lib/structure/graph');
const anon = require('../../lib/process/anonymous-traversal');
const t = require('../../lib/process/traversal');
const gt = require('../../lib/process/graph-traversal');
const V = gt.statics.V;
const Bytecode = require('../../lib/process/bytecode');
const TraversalStrategies = require('../../lib/process/traversal-strategy').TraversalStrategies;

describe('Traversal', function () {

  describe('#getByteCode()', function () {
    it('should add steps for with a string parameter', function () {
      const g = anon.traversal().withGraph(new graph.Graph());
      const bytecode = g.V().out('created').getBytecode();
      assert.ok(bytecode);
      assert.strictEqual(bytecode.sourceInstructions.length, 0);
      assert.strictEqual(bytecode.stepInstructions.length, 2);
      assert.strictEqual(bytecode.stepInstructions[0][0], 'V');
      assert.strictEqual(bytecode.stepInstructions[1][0], 'out');
      assert.strictEqual(bytecode.stepInstructions[1][1], 'created');
    });

    it('should add steps with an enum value', function () {
      const g = anon.traversal().withGraph(new graph.Graph());
      const bytecode = g.V().order().by('age', t.order.desc).getBytecode();
      assert.ok(bytecode);
      assert.strictEqual(bytecode.sourceInstructions.length, 0);
      assert.strictEqual(bytecode.stepInstructions.length, 3);
      assert.strictEqual(bytecode.stepInstructions[0][0], 'V');
      assert.strictEqual(bytecode.stepInstructions[1][0], 'order');
      assert.strictEqual(bytecode.stepInstructions[2][0], 'by');
      assert.strictEqual(bytecode.stepInstructions[2][1], 'age');
      assert.strictEqual(typeof bytecode.stepInstructions[2][2], 'object');
      assert.strictEqual(bytecode.stepInstructions[2][2].typeName, 'Order');
      assert.strictEqual(bytecode.stepInstructions[2][2].elementName, 'desc');
    });
  });

  // describe('#hasNext()', function() {
  //   it('should apply strategies and determine if there is anything left to iterate in the traversal')
  //   const strategyMock = {
  //     apply: function (traversal) {
  //       traversal.traversers = [ new t.Traverser(1, 1), new t.Traverser(2, 1) ];
  //       return Promise.resolve();
  //     }
  //   };
  //   const strategies = new TraversalStrategies();
  //   strategies.addStrategy(strategyMock);
  //   const traversal = new t.Traversal(null, strategies, null);
  //   return traversal.hasNext()
  //       .then(function (more) {
  //         assert.strictEqual(more, true);
  //         return traversal.next();
  //       })
  //       .then(function (item) {
  //         assert.strictEqual(item.value, 1);
  //         assert.strictEqual(item.done, false);
  //         return traversal.next();
  //       })
  //       .then(function (item) {
  //         assert.strictEqual(item.value, 2);
  //         assert.strictEqual(item.done, false);
  //         return traversal.next();
  //       })
  //       .then(function (item) {
  //         assert.strictEqual(item.value, null);
  //         assert.strictEqual(item.done, true);
  //         return traversal.hasNext();
  //       })
  //       .then(function (more) {
  //         assert.strictEqual(more, false);
  //       });
  // });

  describe('#next()', function () {
    it('should apply the strategies and return a Promise with the iterator item', function () {
      const strategyMock = {
        apply: function (traversal) {
          traversal.traversers = [ new t.Traverser(1, 1), new t.Traverser(2, 1) ];
          return Promise.resolve();
        }
      };
      const strategies = new TraversalStrategies();
      strategies.addStrategy(strategyMock);
      const traversal = new t.Traversal(null, strategies, null);
      return traversal.next()
        .then(function (item) {
          assert.strictEqual(item.value, 1);
          assert.strictEqual(item.done, false);
          return traversal.next();
        })
        .then(function (item) {
          assert.strictEqual(item.value, 2);
          assert.strictEqual(item.done, false);
          return traversal.next();
        })
        .then(function (item) {
          assert.strictEqual(item.value, null);
          assert.strictEqual(item.done, true);
          return traversal.next();
        });
    });

    it('should support bulk', function () {
      const strategyMock = {
        apply: function (traversal) {
          traversal.traversers = [ new t.Traverser(1, 2), new t.Traverser(2, 1) ];
          return Promise.resolve();
        }
      };
      const strategies = new TraversalStrategies();
      strategies.addStrategy(strategyMock);
      const traversal = new t.Traversal(null, strategies, null);
      return traversal.next()
        .then(function (item) {
          assert.strictEqual(item.value, 1);
          assert.strictEqual(item.done, false);
          return traversal.next();
        })
        .then(function (item) {
          assert.strictEqual(item.value, 1);
          assert.strictEqual(item.done, false);
          return traversal.next();
        })
        .then(function (item) {
          assert.strictEqual(item.value, 2);
          assert.strictEqual(item.done, false);
          return traversal.next();
        })
        .then(function (item) {
          assert.strictEqual(item.value, null);
          assert.strictEqual(item.done, true);
          return traversal.next();
        });
    });
  });

  if (Symbol.asyncIterator) {
    describe('@@asyncIterator', function () {
      it('should expose the async iterator', function () {
        const traversal = new t.Traversal(null, null, null);
        assert.strictEqual(typeof traversal[Symbol.asyncIterator], 'function');
      });
    });
  }

  describe('#toList()', function () {

    it('should apply the strategies and return a Promise with an array', function () {
      const strategyMock = {
        apply: function (traversal) {
          traversal.traversers = [ new t.Traverser('a', 1), new t.Traverser('b', 1) ];
          return Promise.resolve();
        }
      };
      const strategies = new TraversalStrategies();
      strategies.addStrategy(strategyMock);
      const traversal = new t.Traversal(null, strategies, null);
      return traversal.toList().then(function (list) {
        assert.ok(list);
        assert.deepEqual(list, [ 'a', 'b' ]);
      });
    });

    it('should return an empty array when traversers is empty', function () {
      const strategyMock = {
        apply: function (traversal) {
          traversal.traversers = [];
          return Promise.resolve();
        }
      };
      const strategies = new TraversalStrategies();
      strategies.addStrategy(strategyMock);
      const traversal = new t.Traversal(null, strategies, null);
      return traversal.toList().then(function (list) {
        assert.ok(Array.isArray(list));
        assert.strictEqual(list.length, 0);
      });
    });

    it('should support bulk', function () {
      const strategyMock = {
        apply: function (traversal) {
          traversal.traversers = [ new t.Traverser(1, 1), new t.Traverser(2, 3), new t.Traverser(3, 2),
            new t.Traverser(4, 1) ];
          return Promise.resolve();
        }
      };
      const strategies = new TraversalStrategies();
      strategies.addStrategy(strategyMock);
      const traversal = new t.Traversal(null, strategies, null);
      return traversal.toList()
        .then(list => {
          expect(list).to.have.members([1, 2, 2, 2, 3, 3, 4]);
        });
    });
  });

  describe('#iterate()', function () {
    it('should apply the strategies and return a Promise', function () {
      let applied = false;
      const strategyMock = {
        apply: function (traversal) {
          applied = true;
          traversal.traversers = [ new t.Traverser('a', 1), new t.Traverser('b', 1) ];
          return Promise.resolve();
        }
      };
      const strategies = new TraversalStrategies();
      strategies.addStrategy(strategyMock);
      const traversal = new t.Traversal(null, strategies, new Bytecode());
      return traversal.iterate().then(() => {
        assert.strictEqual(applied, true);
      });
    });
  });

  describe("build", function() {
    it('should only allow anonymous child traversals', function() {
      const g = anon.traversal().withGraph(new graph.Graph());
      assert.doesNotThrow(function() {
        g.V(0).addE("self").to(V(1))
      });

      assert.throws(function() {
        g.V(0).addE("self").to(g.V(1))
      });
    })
  });
});