import type { NextRequest } from 'next/server';
import {
  MEMORY_CATEGORIES,
  MEMORY_TEMPLATE_CATEGORIES,
} from '@/lib/ai/memory-prompts';

export const runtime = 'edge';

// HTML template for the test client
const HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Memory Prompts Test</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    select, button { padding: 0.5rem; margin: 0.5rem 0; }
    label { margin-right: 1rem; }
    #prompt-container { margin-top: 1rem; white-space: pre-wrap; background-color: #f5f5f5; padding: 1rem; border-radius: 4px; }
    .options { display: flex; gap: 1rem; flex-wrap: wrap; margin: 1rem 0; }
    .checkbox-group { display: flex; align-items: center; }
    button { background-color: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .category-list { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
    .category-card { border: 1px solid #ddd; border-radius: 4px; padding: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .category-card:hover { border-color: #0070f3; background-color: #f0f7ff; }
    .category-card h3 { margin: 0 0 0.5rem 0; }
    .category-card p { margin: 0; font-size: 0.9rem; color: #666; }
  </style>
</head>
<body>
  <h1>Memory Prompts Test</h1>
  <p>This tool allows you to test different memory-specific prompt templates. Select a category to view its prompt.</p>

  <div class="category-list">
    ${Object.entries(MEMORY_TEMPLATE_CATEGORIES)
      .map(
        ([key, value]) => `
      <div class="category-card" onclick="selectCategory('${key}')">
        <h3>${value.name}</h3>
        <p>${value.description}</p>
      </div>
    `,
      )
      .join('')}
  </div>

  <div class="options">
    <div>
      <label for="category-select">Memory Category:</label>
      <select id="category-select">
        ${MEMORY_CATEGORIES.map((category) => `<option value="${category}">${MEMORY_TEMPLATE_CATEGORIES[category as keyof typeof MEMORY_TEMPLATE_CATEGORIES].name}</option>`).join('')}
      </select>
    </div>

    <div class="checkbox-group">
      <input type="checkbox" id="include-followups">
      <label for="include-followups">Include Follow-up Questions</label>
    </div>

    <div class="checkbox-group">
      <input type="checkbox" id="safe-mode">
      <label for="safe-mode">Include Anti-Injection Protection</label>
    </div>

    <button id="load-prompt">Load Prompt</button>
  </div>

  <h2>Prompt Result:</h2>
  <div id="prompt-container">Select a category and click "Load Prompt" to view the prompt template.</div>

  <script>
    const categorySelect = document.getElementById('category-select');
    const includeFollowupsCheck = document.getElementById('include-followups');
    const safeModeCheck = document.getElementById('safe-mode');
    const loadPromptButton = document.getElementById('load-prompt');
    const promptContainer = document.getElementById('prompt-container');

    // Function to select a category
    function selectCategory(category) {
      categorySelect.value = category;
      loadPrompt();
    }

    // Function to load the prompt
    async function loadPrompt() {
      const category = categorySelect.value;
      const includeFollowUps = includeFollowupsCheck.checked;
      const safeMode = safeModeCheck.checked;

      try {
        promptContainer.textContent = 'Loading...';
        
        const response = await fetch(\`/api/ai/prompts?category=\${category}&includeFollowUps=\${includeFollowUps}&safe=\${safeMode}\`);
        
        if (!response.ok) {
          throw new Error('Failed to load prompt');
        }
        
        const data = await response.json();
        promptContainer.textContent = data.prompt;
      } catch (error) {
        promptContainer.textContent = 'Error: ' + error.message;
      }
    }

    // Add event listeners
    loadPromptButton.addEventListener('click', loadPrompt);
    
    // Load the default prompt on page load
    document.addEventListener('DOMContentLoaded', () => {
      loadPrompt();
    });
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
