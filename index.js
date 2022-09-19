module.exports = function (cacheObj, fetchFn){
	const fetchMap = new Map();
	const cacheGetFn = cacheObj.get;
	
	cacheObj.get = function (key){
		const value = cacheGetFn.apply(cacheObj, arguments);
		
		if(typeof value != 'undefined')
			return Promise.resolve(value);
		else{
			if(fetchMap.has(key))
				return fetchMap.get(key);
			else{
				const fetchCall = fetchFn.apply(this, arguments);
				fetchMap.set(key, fetchCall);
				// use .then instead of .finally to work with non-standard implementations
				fetchCall.then(value => {
					fetchMap.delete(key);
					cacheObj.set(key, value);
				}, _ => {
					fetchMap.delete(key);
				});
				return fetchCall;
			}
		}
	};
	
	return cacheObj;
};