const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removelicense')
    .setDescription('Remove the License role from a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to remove the License role from')
        .setRequired(true)
    ),
  async execute(interaction) {
    const LICENSE_ROLE_ID = '1402712765604560947';
    const target = interaction.options.getUser('target');
    const member = interaction.guild.members.cache.get(target.id);

    
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
    }

    if (!member) {
      return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }

    if (!member.roles.cache.has(LICENSE_ROLE_ID)) {
      return interaction.reply({ content: `${member.user.tag} does not have the License role.`, ephemeral: true });
    }

   
    const botMember = interaction.guild.members.me;
    if (botMember.roles.highest.position <= member.roles.highest.position) {
      return interaction.reply({ content: 'I cannot manage roles for that user due to role hierarchy.', ephemeral: true });
    }

    try {
      await member.roles.remove(LICENSE_ROLE_ID);

      const embed = new EmbedBuilder()
        .setTitle('License Role Removed')
        .setColor('Red')
        .setDescription(`The License role has been removed from ${member.user} by ${interaction.user}.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      await member.send(`Your License role has been removed in **${interaction.guild.name}**.`);
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Something went wrong while removing the role.', ephemeral: true });
    }
  },
};