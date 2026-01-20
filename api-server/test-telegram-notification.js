const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function createTestChat(siteId) {
  console.log('🔍 Checking Telegram integration...');

  const integration = await prisma.telegramIntegration.findUnique({
    where: { siteId },
    include: { subscriptions: true },
  });

  if (!integration) {
    console.log('❌ No Telegram integration found for this site');
    console.log('Please set up Telegram integration first in Admin Panel');
    return;
  }

  console.log(`✅ Telegram integration found`);
  console.log(`   Bot: ${integration.botUsername}`);
  console.log(`   Subscribers: ${integration.subscriptions.length}`);
  console.log(`   Connect code: ${integration.connectCode}`);

  if (integration.subscriptions.length === 0) {
    console.log('\n⚠️  No subscribers yet!');
    console.log(`   To subscribe, send this to your bot in Telegram:`);
    console.log(`   /start ${integration.connectCode}\n`);
  }

  // Create test chat
  console.log('\n📝 Creating test chat...');

  const visitorId = uuidv4();
  const chat = await prisma.chat.create({
    data: {
      siteId,
      visitorId,
      visitorName: 'Test Visitor',
      status: 'open',
    },
  });

  console.log(`✅ Chat created: ${chat.id}`);

  // Create first message
  const message = await prisma.message.create({
    data: {
      chatId: chat.id,
      from: 'visitor',
      text: 'Привіт! Це тестове повідомлення для перевірки Telegram notifications 🚀',
    },
  });

  console.log(`✅ Message created: ${message.id}`);
  console.log(`\n📱 Check your Telegram for notification!`);
  console.log(`   Chat ID: ${chat.id}`);
  console.log(`   Message: "${message.text}"`);

  // Now trigger the notification manually since we're not going through WebSocket
  console.log(`\n🔔 Triggering Telegram notification...`);

  const fetch = (await import('node-fetch')).default;

  for (const subscription of integration.subscriptions) {
    try {
      const notificationText = `🆕 Новий чат!

👤 Відвідувач: Test Visitor
💬 Повідомлення: "${message.text}"
🌐 Сайт: Demo Site
⏰ ${new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`;

      const adminUrl = process.env.ADMIN_PANEL_URL || 'http://localhost:3001';
      const chatUrl = `${adminUrl}/chats/${chat.id}`;

      const response = await fetch(
        `https://api.telegram.org/bot${integration.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: subscription.chatId,
            text: notificationText,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '📱 Відкрити в Admin Panel',
                    url: chatUrl,
                  },
                ],
              ],
            },
          }),
        }
      );

      if (response.ok) {
        console.log(`✅ Notification sent to ${subscription.firstName || subscription.username || subscription.chatId}`);
      } else {
        const error = await response.json();
        console.log(`❌ Failed to send to ${subscription.chatId}:`, error);
      }
    } catch (error) {
      console.log(`❌ Error sending to ${subscription.chatId}:`, error.message);
    }
  }

  console.log('\n✨ Test complete!');
}

const siteId = process.argv[2] || '3e48c511-bf70-400f-a358-ff82f46ed5a4';

createTestChat(siteId)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
