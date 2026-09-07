const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix for @supabase/supabase-js and @supabase/auth-js resolution in Expo
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
