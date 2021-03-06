let isBrowser;
if ((typeof process !== 'undefined') && process.execPath && process.execPath.match(/node|iojs/)) {
  isBrowser = false;
} else {
  isBrowser = true;
}
describe('asComponent interface', () => {
  let loader = null;
  before((done) => {
    loader = new noflo.ComponentLoader(baseDir);
    loader.listComponents(done);
  });
  describe('with a synchronous function taking a single parameter', () => {
    describe('with returned value', () => {
      const func = (hello) => `Hello ${hello}`;
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'sync-one', component, done);
      });
      it('should be loadable', (done) => {
        loader.load('ascomponent/sync-one', done);
      });
      it('should contain correct ports', (done) => {
        loader.load('ascomponent/sync-one', (err, instance) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(Object.keys(instance.inPorts.ports)).to.eql(['hello']);
          chai.expect(Object.keys(instance.outPorts.ports)).to.eql(['out', 'error']);
          done();
        });
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-one',
          { loader });
        wrapped('World', (err, res) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(res).to.equal('Hello World');
          done();
        });
      });
      it('should forward brackets to OUT port', (done) => {
        loader.load('ascomponent/sync-one', (err, instance) => {
          if (err) {
            done(err);
            return;
          }
          const ins = noflo.internalSocket.createSocket();
          const out = noflo.internalSocket.createSocket();
          const error = noflo.internalSocket.createSocket();
          instance.inPorts.hello.attach(ins);
          instance.outPorts.out.attach(out);
          instance.outPorts.error.attach(error);
          const received = [];
          const expected = [
            'openBracket a',
            'data Hello Foo',
            'data Hello Bar',
            'data Hello Baz',
            'closeBracket a',
          ];
          error.once('data', (data) => done(data));
          out.on('ip', (ip) => {
            received.push(`${ip.type} ${ip.data}`);
            if (received.length !== expected.length) { return; }
            chai.expect(received).to.eql(expected);
            done();
          });
          ins.post(new noflo.IP('openBracket', 'a'));
          ins.post(new noflo.IP('data', 'Foo'));
          ins.post(new noflo.IP('data', 'Bar'));
          ins.post(new noflo.IP('data', 'Baz'));
          ins.post(new noflo.IP('closeBracket', 'a'));
        });
      });
    });
    describe('with returned NULL', () => {
      const func = () => null;
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'sync-null', component, done);
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-null',
          { loader });
        wrapped('World', (err, res) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(res).to.be.a('null');
          done();
        });
      });
    });
    describe('with a thrown exception', () => {
      const func = function (hello) {
        throw new Error(`Hello ${hello}`);
      };
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'sync-throw', component, done);
      });
      it('should send to ERROR port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-throw',
          { loader });
        wrapped('Error', (err) => {
          chai.expect(err).to.be.an('error');
          chai.expect(err.message).to.equal('Hello Error');
          done();
        });
      });
    });
  });
  describe('with a synchronous function taking a multiple parameters', () => {
    describe('with returned value', () => {
      const func = (greeting, name) => `${greeting} ${name}`;
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'sync-two', component, done);
      });
      it('should be loadable', (done) => {
        loader.load('ascomponent/sync-two', done);
      });
      it('should contain correct ports', (done) => {
        loader.load('ascomponent/sync-two', (err, instance) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(Object.keys(instance.inPorts.ports)).to.eql(['greeting', 'name']);
          chai.expect(Object.keys(instance.outPorts.ports)).to.eql(['out', 'error']);
          done();
        });
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-two',
          { loader });
        wrapped({
          greeting: 'Hei',
          name: 'Maailma',
        },
        (err, res) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(res).to.eql({ out: 'Hei Maailma' });
          done();
        });
      });
    });
    describe('with a default value', () => {
      before(function () {
        if (isBrowser) { return this.skip(); }
      }); // Browser runs with ES5 which didn't have defaults
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent((name, greeting = 'Hello') => `${greeting} ${name}`);
        loader.registerComponent('ascomponent', 'sync-default', component, done);
      });
      it('should be loadable', (done) => {
        loader.load('ascomponent/sync-default', done);
      });
      it('should contain correct ports', (done) => {
        loader.load('ascomponent/sync-default', (err, instance) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(Object.keys(instance.inPorts.ports)).to.eql(['name', 'greeting']);
          chai.expect(Object.keys(instance.outPorts.ports)).to.eql(['out', 'error']);
          chai.expect(instance.inPorts.name.isRequired()).to.equal(true);
          chai.expect(instance.inPorts.name.hasDefault()).to.equal(false);
          chai.expect(instance.inPorts.greeting.isRequired()).to.equal(false);
          chai.expect(instance.inPorts.greeting.hasDefault()).to.equal(true);
          done();
        });
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-default',
          { loader });
        wrapped(
          { name: 'Maailma' },
          (err, res) => {
            if (err) {
              done(err);
              return;
            }
            chai.expect(res).to.eql({ out: 'Hello Maailma' });
            done();
          },
        );
      });
    });
  });
  describe('with a function returning a Promise', () => {
    describe('with a resolved promise', () => {
      before(function () {
        if (isBrowser && (typeof window.Promise === 'undefined')) { return this.skip(); }
      });
      const func = (hello) => new Promise((resolve) => setTimeout(() => resolve(`Hello ${hello}`),
        5));
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'promise-one', component, done);
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/promise-one',
          { loader });
        wrapped('World', (err, res) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(res).to.equal('Hello World');
          done();
        });
      });
    });
    describe('with a rejected promise', () => {
      before(function () {
        if (isBrowser && (typeof window.Promise === 'undefined')) {
          this.skip();
        }
      });
      const func = (hello) => new Promise((resolve, reject) => setTimeout(() => reject(new Error(`Hello ${hello}`)),
        5));
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'sync-throw', component, done);
      });
      it('should send to ERROR port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-throw',
          { loader });
        wrapped('Error', (err) => {
          chai.expect(err).to.be.an('error');
          chai.expect(err.message).to.equal('Hello Error');
          done();
        });
      });
    });
  });
  describe('with a synchronous function taking zero parameters', () => {
    describe('with returned value', () => {
      const func = () => 'Hello there';
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'sync-zero', component, done);
      });
      it('should contain correct ports', (done) => {
        loader.load('ascomponent/sync-zero', (err, instance) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(Object.keys(instance.inPorts.ports)).to.eql(['in']);
          chai.expect(Object.keys(instance.outPorts.ports)).to.eql(['out', 'error']);
          done();
        });
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-zero',
          { loader });
        wrapped('bang', (err, res) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(res).to.equal('Hello there');
          done();
        });
      });
    });
    describe('with a built-in function', () => {
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(Math.random);
        loader.registerComponent('ascomponent', 'sync-zero', component, done);
      });
      it('should contain correct ports', (done) => {
        loader.load('ascomponent/sync-zero', (err, instance) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(Object.keys(instance.inPorts.ports)).to.eql(['in']);
          chai.expect(Object.keys(instance.outPorts.ports)).to.eql(['out', 'error']);
          done();
        });
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/sync-zero',
          { loader });
        wrapped('bang', (err, res) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(res).to.be.a('number');
          done();
        });
      });
    });
  });
  describe('with an asynchronous function taking a single parameter and callback', () => {
    describe('with successful callback', () => {
      const func = function (hello, callback) {
        setTimeout(() => callback(null, `Hello ${hello}`),
          5);
      };
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'async-one', component, done);
      });
      it('should be loadable', (done) => {
        loader.load('ascomponent/async-one', done);
      });
      it('should contain correct ports', (done) => {
        loader.load('ascomponent/async-one', (err, instance) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(Object.keys(instance.inPorts.ports)).to.eql(['hello']);
          chai.expect(Object.keys(instance.outPorts.ports)).to.eql(['out', 'error']);
          done();
        });
      });
      it('should send to OUT port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/async-one',
          { loader });
        wrapped('World', (err, res) => {
          if (err) {
            done(err);
            return;
          }
          chai.expect(res).to.equal('Hello World');
          done();
        });
      });
    });
    describe('with failed callback', () => {
      const func = function (hello, callback) {
        setTimeout(() => callback(new Error(`Hello ${hello}`)),
          5);
      };
      it('should be possible to componentize', (done) => {
        const component = () => noflo.asComponent(func);
        loader.registerComponent('ascomponent', 'async-throw', component, done);
      });
      it('should send to ERROR port', (done) => {
        const wrapped = noflo.asCallback('ascomponent/async-throw',
          { loader });
        wrapped('Error', (err) => {
          chai.expect(err).to.be.an('error');
          chai.expect(err.message).to.equal('Hello Error');
          done();
        });
      });
    });
  });
});
