const { EmbedBuilder } = require("discord.js");
const { logInfo } = require("./logger");

/**
 * Sends an embedded error message to a Discord channel or interaction response.
 *
 * @param {CommandInteraction | TextChannel} interaction
 * - The interaction or channel where the error message will be sent.
 * @param {string} description - The error message content.
 * @param {Error} [error=null]
 * - An optional error object to log and display additional details.
 * @returns {Promise<void>}
 */
async function printError(interaction, description, error = null) {
  try {
    const embed = new EmbedBuilder()
      .setTitle(":x: Error")
      .setDescription(description)
      .setColor("Red");

    if (error) {
      const footer =
        `${error.name || "Error"}: ` +
        `${error.message || error.response?.statusText} ` +
        `${error.status ? `(${error.status})` : ""}`;
      embed.setFooter({ text: footer });
    } else {
      logInfo("printError", description);
    }

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed] });
    } else if (!error) {
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.send({ embeds: [embed] });
    }
  } catch (err) {
    logInfo("printError", err);
  }
}

module.exports = { printError };
