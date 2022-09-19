# node-cache-promised-fetch-get
Have the `.get()` method of a cache object to return a promise that is resolved after asynchronously fetching a missing value.

## Why it exists?

This project came to existence because of the need to have the `.get()` method of a cache instance to:
- return a promise so that values could be fetched from asynchronous sources,
- return a promise which will (potentially) be resolved with the value fetched by a remote request even if that request is already in progress (triggered by a previous `.get()` invocation), that is, it will not trigger a new request for each `.get(key)` for the same `key`,
- do the above even if the cache provider gets changed.

There are plenty of wonderful cache projects out there ([node-cache](https://github.com/node-cache/node-cache) is simple and great, [lru-cache](https://github.com/isaacs/node-lru-cache) has tons of options, etc.) and I wanted to be able to use this feature regardless of the provider I will need to pick for each use case. It didn't seem like a sensible addition to an existing cache project either hence this project is here now.

## What exactly is it doing?

Since caches usually provide the standard `get()/set()/has()` API this module expects to be given such an object on which it is going to directly wrap and replace its `get()` method to provide the above described functionality.

```js
const nodeCachePromisedFetchGet = require('node-cache-promised-fetch-get');
...
const myCache = nodeCachePromisedFetchGet(new CacheProvider(), fetchFn);

```

The `fetchFn` parameter must be an `async` function defined like:

```js
/**
 * @param {String} key The key to fetch the value for
 * @returns {Promise} A Promise resolved with a value
 */
fetchFn(key)
```

This function will get invoked every time a key is requested that does not have a recent value in the cache (the cache returns non-`undefined` value for `.get(key)`) and there is no outstanding `Promise` object for this key already. The arguments passed will be the same as passed to the `.get()` call. The returned promise is expected to be either resolved or rejected within some reasonable time. This promise object is returned as the result of the current `.get(key)` call and, until it gets resolved or rejected, further requests for that key will keep returning the same promise.

None of the other methods or properties of the cache object will be altered so they can be used as usual.

```js
// creating the cache
const myCache = nodeCachePromisedFetchGet(new CacheProvider(), key => {
	console.log('requesting ', key);
	return someAsyncCallThatReturnsAPromise(key);	// the expected value this is going to be resolved with can be "a-result" for example
});
...
// then requesting the value "a-key" from the cache
myCache.get('a-key').then( res => console.log('first call returns ', res) );
...
// and a bit later requesting the value "a-key" again
myCache.get('a-key').then( res => console.log('second call returns ', res) );
...
// and then much later after the value "a-key" has expired from the cache
myCache.get('a-key').then( res => console.log('third call returns ', res) );

```

And the expected logs in the console would be:

```
> requesting a-key
> first call returns a-result
> second call returns a-result
> requesting a-key
> third call returns a-result

```

## License

MIT
