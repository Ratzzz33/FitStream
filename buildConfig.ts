// Build configuration flags
// Set during build process for different build variants

export const BUILD_CONFIG = {
  isAdminBuild: false,
  isDebugBuild: process.env.NODE_ENV !== 'production',
};
