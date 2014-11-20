# vinyl-request

Turn HTTP requests into vinyl.

![build status](http://img.shields.io/travis/izaakschroeder/vinyl-request.svg?style=flat)
![coverage](http://img.shields.io/coveralls/izaakschroeder/vinyl-request.svg?style=flat)
![license](http://img.shields.io/npm/l/vinyl-request.svg?style=flat)
![version](http://img.shields.io/npm/v/vinyl-request.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/vinyl-request.svg?style=flat)

Now you can use HTTP requests as if they were vinyl!

```javascript
var gulp = require('gulp'),
	http = require('vinyl-request');

gulp.task('download', function() {
	return http.src('http://i.imgur.com/XHx0XLw.jpg')
		.pipe(gulp.dest('downloads'));
});
```
