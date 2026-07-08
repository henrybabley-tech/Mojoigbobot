require('dotenv').config();
const { Telegraf } = require('telegraf');
const translate = require('google-translate-api-x');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is missing. Set it in your .env file or Railway variables.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Language codes: English = 'en', Igbo = 'ig'
const EN = 'en';
const IG = 'ig';

/**
 * Translates text automatically:
 * - If detected language is English -> translate to Igbo
 * - Otherwise (assumed Igbo or anything else) -> translate to English
 */
async function autoTranslate(text) {
  const detection = await translate(text, { to: EN });
  const detectedLang = detection.from.language.iso;

  if (detectedLang === EN) {
    const result = await translate(text, { from: EN, to: IG });
    return { translated: result.text, direction: 'English → Igbo' };
  } else {
    const result = await translate(text, { to: EN });
    return { translated: result.text, direction: `${detectedLang.toUpperCase()} → English` };
  }
}

bot.start((ctx) => {
  ctx.reply(
    `Hi ${ctx.from.first_name}! 👋\n\n` +
    `I'm Mojo Igbo Bot 🇳🇬 — send me any text in English or Igbo and I'll translate it.\n\n` +
    `Commands:\n` +
    `/toig <text> — force translate to Igbo\n` +
    `/toen <text> — force translate to English\n` +
    `/help — show this message again`
  );
});

bot.help((ctx) => {
  ctx.reply(
    `Just type a sentence and I'll auto-detect and translate it.\n\n` +
    `Or use:\n` +
    `/toig <text> — English → Igbo\n` +
    `/toen <text> — Igbo → English`
  );
});

bot.command('toig', async (ctx) => {
  const text = ctx.message.text.replace('/toig', '').trim();
  if (!text) return ctx.reply('Usage: /toig <text to translate>');
  try {
    const result = await translate(text, { from: EN, to: IG });
    ctx.reply(result.text);
  } catch (err) {
    console.error(err);
    ctx.reply('Sorry, translation failed. Please try again.');
  }
});

bot.command('toen', async (ctx) => {
  const text = ctx.message.text.replace('/toen', '').trim();
  if (!text) return ctx.reply('Usage: /toen <text to translate>');
  try {
    const result = await translate(text, { from: IG, to: EN });
    ctx.reply(result.text);
  } catch (err) {
    console.error(err);
    ctx.reply('Sorry, translation failed. Please try again.');
  }
});

// Auto-translate any plain text message
bot.on('text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return;

  try {
    const { translated, direction } = await autoTranslate(text);
    ctx.reply(`${translated}\n\n_(${direction})_`, { parse_mode: 'Markdown' });
  } catch (err) {
    console.error(err);
    ctx.reply('Sorry, something went wrong while translating. Please try again.');
  }
});

bot.launch();
console.log('Mojo Igbo Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
