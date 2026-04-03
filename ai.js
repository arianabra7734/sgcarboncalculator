// ===== AI Integration (OpenAI & Gemini) =====

const generateBtn = document.getElementById('generateInsights');
const aiContent = document.getElementById('aiInsights');

function buildPrompt(results, profile) {
  return `You are a sustainability advisor specializing in Singapore.

A user in Singapore has calculated their monthly carbon footprint:

Carbon Footprint Breakdown:
- Energy: ${results.energy} kg CO₂
- Transport: ${results.transport} kg CO₂
- Food: ${results.food} kg CO₂
- Waste: ${results.waste} kg CO₂
- Total: ${results.total} kg CO₂/month

Singapore average is approximately 430 kg CO₂/month per person.

User Profile:
- Electricity: ${profile.electricity} kWh/month for ${profile.householdSize} people
- Housing: ${profile.housingType}
- Aircon: ${profile.aircon} hours/day
- Transport: ${profile.transportMode}, ${profile.weeklyDistance} km/week
- Diet: ${profile.dietType}
- Meals out: ${profile.mealsOut} per week
- Recycling: ${profile.recycling}
- Plastic usage: ${profile.plasticUsage}
- Online shopping: ${profile.onlineShopping}

Please provide:
1. A brief assessment of their footprint (1-2 sentences)
2. 3-5 personalized, practical recommendations specific to Singapore (mention local alternatives like MRT, hawker centres, NEA programs, etc.)
3. Estimated monthly CO₂ reduction for each recommendation (in kg)
4. One easy quick-win action they can start today

Format your response in clear sections with headers. Keep it concise and encouraging.`;
}

async function callOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful sustainability advisor. Format responses with markdown-style headers (##) and bullet points.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(prompt, apiKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }],
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error (${response.status})`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

function renderMarkdown(text) {
  // Simple markdown-to-HTML conversion
  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/^# (.+)$/gm, '<h4>$1</h4>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Unordered lists
    .replace(/^[-•] (.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
    const cleaned = match.replace(/<br>/g, '');
    return `<ul>${cleaned}</ul>`;
  });

  return `<p>${html}</p>`;
}

generateBtn.addEventListener('click', async () => {
  const provider = localStorage.getItem('sg-carbon-ai-provider') || 'openai';
  const apiKey = localStorage.getItem('sg-carbon-api-key') || '';

  if (!apiKey) {
    aiContent.innerHTML = '<div class="ai-error">Please configure your API key in Settings first.</div>';
    return;
  }

  const results = window.carbonResults;
  if (!results) {
    aiContent.innerHTML = '<div class="ai-error">Please fill in your lifestyle details first.</div>';
    return;
  }

  // Show loading
  aiContent.innerHTML = '<div class="ai-loading"><div class="spinner"></div><span>Generating personalized insights...</span></div>';
  generateBtn.disabled = true;

  try {
    const profile = getUserProfile();
    const prompt = buildPrompt(results, profile);

    let response;
    if (provider === 'openai') {
      response = await callOpenAI(prompt, apiKey);
    } else {
      response = await callGemini(prompt, apiKey);
    }

    aiContent.innerHTML = renderMarkdown(response);
  } catch (error) {
    aiContent.innerHTML = `<div class="ai-error">Error: ${error.message}</div>`;
  } finally {
    generateBtn.disabled = false;
  }
});
