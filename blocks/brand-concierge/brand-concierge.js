const SUPABASE_URL = 'https://cyjquwhkmzyedkwuaffc.supabase.co/functions/v1/brand-chat';

let modal = null;
const conversationHistory = [];

function close() {
  if (modal) {
    modal.remove();
    modal = null;
    document.body.style.overflow = '';
  }
}

function addMessage(container, text, role) {
  const msg = document.createElement('div');
  msg.className = `concierge-message concierge-${role}`;
  msg.textContent = text;
  container.append(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}

async function sendMessage(messagesContainer, text) {
  addMessage(messagesContainer, text, 'user');
  conversationHistory.push({ role: 'user', content: text });

  const thinking = document.createElement('div');
  thinking.className = 'concierge-message concierge-assistant concierge-thinking';
  thinking.innerHTML = '<span></span><span></span><span></span>';
  messagesContainer.append(thinking);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const resp = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    });
    const data = await resp.json();

    thinking.remove();

    let reply = '';
    if (data.output) {
      const textOutput = data.output.find((o) => o.type === 'message');
      if (textOutput?.content) {
        reply = textOutput.content
          .filter((c) => c.type === 'output_text')
          .map((c) => c.text)
          .join('\n');
      }
    }
    if (!reply) reply = 'I wasn\'t able to find an answer. Please try rephrasing your question.';

    const assistantMsg = addMessage(messagesContainer, '', 'assistant');
    // Remove citation markers like 【...】
    reply = reply.replace(/【[^】]*】/g, '');
    assistantMsg.textContent = reply;
    conversationHistory.push({ role: 'assistant', content: reply });
  } catch {
    thinking.remove();
    addMessage(messagesContainer, 'Something went wrong. Please try again.', 'assistant');
  }
}

function buildModal(initialQuery) {
  const overlay = document.createElement('div');
  overlay.className = 'concierge-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'concierge-dialog';

  // Header
  const header = document.createElement('div');
  header.className = 'concierge-header';
  header.innerHTML = '<span class="concierge-title">Lord Abbett Concierge</span>';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'concierge-close';
  closeBtn.type = 'button';
  closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  closeBtn.addEventListener('click', close);
  header.append(closeBtn);
  dialog.append(header);

  // Messages
  const messages = document.createElement('div');
  messages.className = 'concierge-messages';
  dialog.append(messages);

  // Input area
  const inputArea = document.createElement('div');
  inputArea.className = 'concierge-input-area';

  const inputWrap = document.createElement('div');
  inputWrap.className = 'concierge-input-wrap';

  const input = document.createElement('textarea');
  input.className = 'concierge-input';
  input.placeholder = 'Reply...';
  input.rows = 1;
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = `${input.scrollHeight}px`;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        input.value = '';
        input.style.height = 'auto';
        sendMessage(messages, text);
      }
    }
  });

  const sendBtn = document.createElement('button');
  sendBtn.className = 'concierge-send';
  sendBtn.type = 'button';
  sendBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';
  sendBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (text) {
      input.value = '';
      input.style.height = 'auto';
      sendMessage(messages, text);
    }
  });

  inputWrap.append(input);
  inputWrap.append(sendBtn);
  inputArea.append(inputWrap);
  dialog.append(inputArea);

  overlay.append(dialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.body.append(overlay);
  document.body.style.overflow = 'hidden';
  modal = overlay;

  // Restore previous conversation
  conversationHistory.forEach((msg) => {
    addMessage(messages, msg.content, msg.role);
  });

  // Send initial query
  if (initialQuery) {
    sendMessage(messages, initialQuery);
  }
}

export function hasConversation() {
  return conversationHistory.length > 0;
}

export default async function openConcierge(query) {
  if (modal) return;

  // Load CSS
  if (!document.querySelector('link[href*="brand-concierge.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/blocks/brand-concierge/brand-concierge.css';
    document.head.append(link);
  }

  buildModal(query);
}
