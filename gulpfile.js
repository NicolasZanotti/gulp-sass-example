const gulp = require('gulp');
const path = require('path');
const through = require('through2');
const sass = require('sass');
const del = require('del');

const sassGlobs = './src/**/*.scss';
const sassOptions = {
	outputStyle: 'expanded' // compressed
};
const sassVariables = {
	color: 'red'
};

function replaceFileExtension(filePath, extension) {
	if (typeof filePath !== 'string') return filePath;
	if (filePath.length === 0) return filePath;

	let fileName = path.basename(filePath, path.extname(filePath)) + extension;
	return path.join(path.dirname(filePath), fileName);
}

let sassVariablesToString = function(sassVariables) {
	if (!sassVariables) return '';

	let str = '';
	for (let variable in sassVariables) {
		if (sassVariables.hasOwnProperty(variable)) {
			str += ('$' + variable) + ': ' + JSON.stringify(sassVariables[variable]) + ';\n';
		}
	}

	return str;
};

function sassify(options, variables) {
	return through.obj(function(file, enc, cb) {
		if (file.isNull()) return cb(null, file);
		if (file.isStream()) return cb(new Error('Streaming not supported'));
		if (path.basename(file.path).indexOf('_') === 0) return cb();
		if (!file.contents.length) {
			file.path = replaceFileExtension(file.path, '.css');
			return cb(null, file);
		}

		let opts = Object.assign({}, options);
		opts.data = sassVariablesToString(variables) + file.contents.toString();

		sass.render(opts, (error, obj) => {
			if (error) {
				return cb(new Error(error));
			}
			file.contents = obj.css;
			file.path = replaceFileExtension(file.path, '.css');

			cb(null, file);
		});
	});
}

gulp
	.task('clean', () => del('dist'))

	.task('build', () => (
		gulp
			.src(sassGlobs)
			.pipe(sassify(sassOptions, sassVariables))
			.pipe(gulp.dest('dist'))
	))

	.task('watch', ['clean', 'build'], () => (
		gulp
			.watch(sassGlobs, {debounceDelay: 2000}, ['build'])
			.on('change', (event) => console.log(path.basename(event.path) + ' changed'))
	))

	.task('default', ['clean', 'build']);
