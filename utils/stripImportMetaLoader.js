module.exports = function stripImportMeta(source) {
	return String(source)
		.replace(/import\.meta\.webpackHot\.accept\(\);?/g, '')
		.replace(/import\.meta/g, '({})');
};
