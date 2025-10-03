const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('givelicense')
    .setDescription('Give the License role to a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The member to give the License role')
        .setRequired(true)
    ),
  async execute(interaction) {
    const LICENSE_ROLE_ID = '1403853403741880495';
    const target = interaction.options.getUser('target');
    const member = interaction.guild.members.cache.get(target.id);

    
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: 'You do not have permission to manage roles.', ephemeral: true });
    }

    if (!member) {
      return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
    }

    if (member.roles.cache.has(LICENSE_ROLE_ID)) {
      return interaction.reply({ content: `${member.user.tag} already has the License role.`, ephemeral: true });
    }

    
    const botMember = interaction.guild.members.me;
    if (botMember.roles.highest.position <= member.roles.highest.position) {
      return interaction.reply({ content: 'I cannot manage roles for that user due to role hierarchy.', ephemeral: true });
    }

    try {
      await member.roles.add(LICENSE_ROLE_ID);

      const embed = new EmbedBuilder()
        .setTitle('License Role Granted')
        .setColor('Green')
        .setDescription(`${member.user} has been given the License role by ${interaction.user}.`)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      await member.send(`You have been granted the License role in **${interaction.guild.name}**! Use it wisely.`);
    } catch (error) {
      console.error(error);
      interaction.reply({ content: 'Something went wrong while adding the role.', ephemeral: true });
    }
  },
};
