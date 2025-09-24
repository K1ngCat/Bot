require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { loadRegistrations } = require('./utils/registrationStorage');
const { restorePurchases } = require('./restorePurchases'); // 👈 restore system

// Import session management utilities
const SessionManager = require('./utils/sessionManager');
const CountdownManager = require('./utils/countdownManager');
const EmbedBuilderUtil = require('./utils/embedBuilder');

// ===== Create Discord client =====
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // needed for role checks
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Initialize session managers
client.sessionManager = new SessionManager();
client.countdownManager = new CountdownManager();

// ===== Recursive command loader function =====
function loadCommandsRecursively(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            loadCommandsRecursively(fullPath);
        } else if (file.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                if (command?.data?.name) {
                    client.commands.set(command.data.name, command);
                    console.log(`✅ Loaded command: ${command.data.name} from ${fullPath}`);
                } else {
                    console.warn(`⚠️ Command file ${file.name} is missing data.name`);
                }
            } catch (err) {
                console.error(`❌ Failed to load command ${file.name}:`, err.message);
            }
        }
    }
}

// ===== Load commands recursively from the 'commands' folder =====
const commandsPath = path.join(__dirname, 'commands');
loadCommandsRecursively(commandsPath);

// ===== Load registrations =====
try {
    client.registrations = loadRegistrations();
    console.log(`📦 Loaded ${client.registrations.size || 0} registrations`);
} catch (err) {
    console.error("❌ Failed to load registrations:", err);
}

// ===== Interaction handler =====
client.on('interactionCreate', async (interaction) => {
    // --- SLASH COMMAND HANDLER ---
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(`❌ Error executing ${interaction.commandName}:`, error);
            const replyPayload = { content: 'There was an error while executing this command!', ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyPayload);
            } else {
                await interaction.reply(replyPayload);
            }
        }
    }
    // --- BUTTON HANDLER ---
    else if (interaction.isButton()) {
        // Handle session reinvite button
        if (interaction.customId === 'reinvite_button') {
            const session = client.sessionManager.getSession(interaction.channelId);
            
            if (!session) {
                return await interaction.reply({ 
                    content: 'No active session found!', 
                    ephemeral: true 
                });
            }
            
            try {
                const dmEmbed = EmbedBuilderUtil.getDMEmbed(session.link, true);
                await interaction.user.send({ embeds: [dmEmbed] });
                
                client.sessionManager.addReinviteUser(interaction.channelId, interaction.user.id);
                
                await interaction.reply({ 
                    content: `✅ Reinvite sent to ${interaction.user.toString()}!`, 
                    ephemeral: true 
                });
                
            } catch (dmError) {
                console.error('Failed to send reinvite DM:', dmError);
                await interaction.reply({ 
                    content: '❌ Could not send you a DM. Please check your privacy settings!', 
                    ephemeral: true 
                });
            }
        }
        
        // Handle your existing notification button
        else if (interaction.customId === 'notify_session') {
            const sessionDataPath = path.join(__dirname, 'sessionData.json');
            let sessionData;

            try {
                sessionData = JSON.parse(fs.readFileSync(sessionDataPath, 'utf-8'));
            } catch {
                // If there's no session file, the buttons are from an old session.
                await interaction.reply({ content: '❌ This session has already ended.', ephemeral: true });
                return;
            }

            if (sessionData.notifyUsers.includes(interaction.user.id)) {
                await interaction.reply({ content: '👍 You are already on the notification list!', ephemeral: true });
                return;
            }

            sessionData.notifyUsers.push(interaction.user.id);
            fs.writeFileSync(sessionDataPath, JSON.stringify(sessionData, null, 4));

            await interaction.reply({ content: '✅ You will be notified via DM when the session starts!', ephemeral: true });
        }
        
        // Handle your existing rejoin button
        else if (interaction.customId === 'rejoin_session') {
            const sessionDataPath = path.join(__dirname, 'sessionData.json');
            let sessionData;

            try {
                sessionData = JSON.parse(fs.readFileSync(sessionDataPath, 'utf-8'));
            } catch {
                await interaction.reply({ content: '❌ This session has already ended.', ephemeral: true });
                return;
            }

            if (!sessionData.link) {
                return interaction.reply({ content: '❌ The session link is missing from my data. The session may not have started yet.', ephemeral: true });
            }

            const rejoinDmEmbed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('🔄 Here is Your Rejoin Link')
                .setDescription(`Here is the session link you requested.\n\n🔗 **[Click here to join the session](${sessionData.link})**\n\nThis message will be deleted in 1 minute.`)
                .setFooter({ text: 'Greenville RP | Rejoin Link' });

            try {
                const dm = await interaction.user.send({ embeds: [rejoinDmEmbed] });
                await interaction.reply({ content: '✅ The rejoin link has been sent to your DMs!', ephemeral: true });
                setTimeout(() => dm.delete().catch(() => {}), 60 * 1000);
            } catch (error) {
                await interaction.reply({ content: '❌ I couldn\'t send you a DM. Please check your privacy settings.', ephemeral: true });
            }
        }
    }
});

// Handle message reactions for session ping
client.on('messageReactionAdd', async (reaction, user) => {
    // When a reaction is received, check if the reaction is a partial
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Something went wrong when fetching the reaction:', error);
            return;
        }
    }
    
    // Check if this is a session ping message
    const session = client.sessionManager.getSession(reaction.message.channelId);
    if (session && session.messageId === reaction.message.id && reaction.emoji.name === '✅') {
        // Add user to participants if not already added
        client.sessionManager.addParticipant(reaction.message.channelId, user.id);
    }
});

// ===== Ready event =====
client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    // Clean up expired sessions on startup
    client.sessionManager.cleanupExpiredSessions();
    client.countdownManager.cleanupExpiredCountdowns();
    
    // Set up periodic cleanup (every hour)
    setInterval(() => {
        client.sessionManager.cleanupExpiredSessions();
    }, 3600000);
    
    restorePurchases(client); // 👈 Restores timers & removes expired roles
});

// ===== Global error handling =====
process.on('unhandledRejection', (err) => {
    console.error('🚨 Unhandled Rejection:', err);
});

// ===== Login =====
client.login(process.env.TOKEN)
    .then(() => console.log("🔑 Login request sent to Discord..."))
    .catch(err => {
        console.error("❌ Failed to login:", err);
    });