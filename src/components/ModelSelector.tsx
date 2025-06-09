interface ModelSelectorProps {
  selectedModel: string;
  selectedProvider: string;
  onModelChange: (model: string) => void;
  onProviderChange: (provider: string) => void;
}

const MODELS = {
  openai: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini" },
    { id: "gpt-4o", name: "GPT-4o" },
    { id: "gpt-4", name: "GPT-4" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  ],
  google: [
    { id: "gemini-pro", name: "Gemini Pro" },
    { id: "gemini-pro-vision", name: "Gemini Pro Vision" },
  ],
  openrouter: [
    { id: "anthropic/claude-3-opus", name: "Claude 3 Opus" },
    { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
    { id: "meta-llama/llama-2-70b-chat", name: "Llama 2 70B" },
    { id: "mistralai/mixtral-8x7b-instruct", name: "Mixtral 8x7B" },
  ],
};

export function ModelSelector({ selectedModel, selectedProvider, onModelChange, onProviderChange }: ModelSelectorProps) {
  const handleProviderChange = (provider: string) => {
    onProviderChange(provider);
    // Set default model for the provider
    const defaultModel = MODELS[provider as keyof typeof MODELS][0]?.id;
    if (defaultModel) {
      onModelChange(defaultModel);
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provider
        </label>
        <select
          value={selectedProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="openai">OpenAI</option>
          <option value="google">Google AI</option>
          <option value="openrouter">OpenRouter</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Model
        </label>
        <select
          value={selectedModel}
          onChange={(e) => onModelChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {MODELS[selectedProvider as keyof typeof MODELS]?.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
