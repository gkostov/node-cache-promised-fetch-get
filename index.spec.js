const {expect} = require('chai');

const nodeCachePromisedFetchGet = require('.');

const Cache = function (){
	return {
		map: {},
		get: function (key){
			return this.map[key];
		},
		set: function (key, value){
			this.map[key] = value;
		},
		delete: function (key){
			delete this.map[key];
		}
	};
};

describe('node-cache-promised-fetch-get', () => {
	it('only calls the fetch function once and then waits for the async request to complete', async () => {
		let fetchCalls = 0;
		const myFecthFn = key => new Promise((resolve, _) => {
			++fetchCalls;
			setTimeout( _ => resolve('a-result'), 500);
		});
		const myCache = nodeCachePromisedFetchGet(new Cache(), myFecthFn);
		
		let res1 = myCache.get('a-key');
		expect(fetchCalls).to.equal(1, 'a call on the first .get()');
		let res2 = myCache.get('a-key');
		expect(fetchCalls).to.equal(1, 'no other call has been sent after the second .get()');
		
		expect(res1).to.equal(res2, 'returns the same Promise');
		
		expect(await res1).to.equal('a-result', 'the result of the first .get()');
		expect(await res2).to.equal('a-result', 'the result of the second .get()');
		
		let res3 = myCache.get('a-key');
		expect(res3).to.not.equal(res1, 'returns a Promise wrapping the result from the cache because the async call is done now');

		expect(fetchCalls).to.equal(1, 'no other call has been sent after the third .get()');
		
		myCache.delete('a-key');	// expire the key
		
		let res4 = myCache.get('a-key');
		expect(res4).to.not.equal(res1, 'returns a different Promise for the new async call');
		expect(fetchCalls).to.equal(2, 'another call for the .get() after the key has expired');
	});
});
