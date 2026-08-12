const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Limit max parallel worker threads to prevent Node jest-worker out of memory on Windows
config.maxWorkers = 2;

module.exports = config;
