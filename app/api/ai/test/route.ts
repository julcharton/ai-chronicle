import type { NextRequest } from 'next/server';

export const runtime = 'edge';

// HTML template for our test client
const HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>AI Completion Test</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 800px; margin: 0 auto; }
    textarea { width: 100%; height: 120px; margin: 1rem 0; padding: 0.5rem; }
    .messages { margin: 1rem 0; border: 1px solid #ddd; border-radius: 4px; padding: 1rem; height: 300px; overflow-y: auto; }
    .message { padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 4px; }
    .user { background-color: #e9f5ff; text-align: right; }
    .assistant { background-color: #f0f0f0; }
    button { padding: 0.5rem 1rem; background-color: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .controls { display: flex; gap: 0.5rem; }
    label { margin-right: 0.5rem; }
  </style>
</head>
<body>
  <h1>AI Completion Test</h1>
  <p>This is a simple interface to test the AI completion API.</p>
  
  <div class="messages" id="messages"></div>
  
  <textarea id="prompt" placeholder="Type your message here..."></textarea>
  
  <div class="controls">
    <button id="sendBtn">Send</button>
    <div>
      <label><input type="checkbox" id="streamToggle" checked> Stream response</label>
    </div>
  </div>
  
  <script>
    const messagesEl = document.getElementById('messages');
    const promptEl = document.getElementById('prompt');
    const sendBtn = document.getElementById('sendBtn');
    const streamToggle = document.getElementById('streamToggle');
    
    // Store conversation history
    const messages = [];
    
    // Add a message to the UI
    function addMessage(content, role) {
      const messageEl = document.createElement('div');
      messageEl.classList.add('message', role);
      messageEl.textContent = content;
      messagesEl.appendChild(messageEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      
      // Add to our messages array for API context
      messages.push({ role, content });
    }
    
    // Send a message to the API
    async function sendMessage() {
      const content = promptEl.value.trim();
      if (!content) return;
      
      // Add user message
      addMessage(content, 'user');
      promptEl.value = '';
      
      // Disable UI during request
      sendBtn.disabled = true;
      promptEl.disabled = true;
      
      // Create response placeholder
      const responseEl = document.createElement('div');
      responseEl.classList.add('message', 'assistant');
      responseEl.textContent = 'Thinking...';
      messagesEl.appendChild(responseEl);
      
      try {
        if (streamToggle.checked) {
          // Streaming response
          const response = await fetch('/api/ai/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, stream: true }),
          });
          
          if (!response.ok) throw new Error('API request failed');
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          responseEl.textContent = '';
          
          // Process the stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value);
            responseEl.textContent += text;
            messagesEl.scrollTop = messagesEl.scrollHeight;
          }
          
          // Add the complete message to our history
          messages.pop(); // Remove the placeholder
          messages.push({ role: 'assistant', content: responseEl.textContent });
          
        } else {
          // Non-streaming response
          const response = await fetch('/api/ai/completion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, stream: false }),
          });
          
          if (!response.ok) throw new Error('API request failed');
          
          const data = await response.json();
          responseEl.textContent = data.completion;
          
          // Add to our messages array
          messages.pop(); // Remove the placeholder
          messages.push({ role: 'assistant', content: data.completion });
        }
      } catch (error) {
        responseEl.textContent = 'Error: ' + error.message;
        console.error(error);
      } finally {
        // Re-enable UI
        sendBtn.disabled = false;
        promptEl.disabled = false;
        promptEl.focus();
      }
    }
    
    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    promptEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    
    // Focus on input on load
    promptEl.focus();
  </script>
</body>
</html>
`;

export async function GET(_req: NextRequest) {
  return new Response(HTML, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
