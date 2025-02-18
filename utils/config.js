const config = require("../config.json");

/**
 * Checks if the application is running in development mode.
 * @returns {boolean} True if development mode is enabled, otherwise false.
 */
function isDev() {
  return process.argv.includes("dev");
}

/**
 * Retrieves the configuration for a specific guild by its ID.
 * @param {string} guildId - The ID of the guild.
 * @returns {object} The configuration object for the specified guild.
 * @throws {Error} Throws an error if the guild is
 * not found in the configuration.
 */
function getGuildConfig(guildId) {
  const guildConfig = config.guilds[guildId];

  if (!guildConfig) {
    throw new Error(`Guild ${guildId} not found in config.`);
  }

  return guildConfig;
}

/**
 * Retrieves the configuration for a specific guild by its name.
 * @param {string} guildName - The name of the guild.
 * @returns {object} The configuration object for the specified guild.
 * @throws {Error} Throws an error if the guild is
 * not found in the configuration.
 */
function getGuildConfigByName(guildName) {
  const guildConfig = Object.values(config.guilds).find(
    (guild) => guild.name === guildName
  );

  if (!guildConfig) {
    throw new Error(`Guild ${guildName} not found in config.`);
  }

  return guildConfig;
}

/**
 * Retrieves google credentials from the configuration file.
 * @returns {object} The google credentials object.
 */
function getGoogleCredentials() {
  return config.auth;
}

/**
 * Retrieves the common configuration settings.
 * @returns {object} The common configuration object.
 */
function getCommonConfig() {
  return config.common;
}

/**
 * Retrieves all guild IDs and names from the configuration file.
 * @returns {{ name: string, value: string }[]}
 * An array of objects containing guild names and their corresponding IDs.
 */
function getGuildIdsAndNames() {
  return Object.entries(config.guilds)
    .filter(([_, guild]) => {
      return isDev() ? guild.isDev === true : guild.isDev !== true;
    })
    .map(([id, { name }]) => ({ name, value: id }));
}

module.exports = {
  isDev,
  getGuildConfig,
  getGuildConfigByName,
  getGoogleCredentials,
  getCommonConfig,
  getGuildIdsAndNames
};
