	var query_string = location.search;
	console.log('query_string: ' + query_string);

	function nofollow() {
		if (query_string == '') {
			// the rule is only if ANYTHING is in the query string, then nofollow true
			return true;
		} else
			return false;
	}
