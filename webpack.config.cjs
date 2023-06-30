const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
	target: "node",
	entry: "./src/app.js",
	output: {
		filename: "app.js",
		path: path.resolve(__dirname, "build"),
	},
	// externals: [
	// 	nodeExternals(),
	// ],
};
