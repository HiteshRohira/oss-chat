import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";

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
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
    {
      id: "gemini-2.5-flash-lite-preview-06-17",
      name: "Gemini 2.5 Flash Lite",
    },
  ],
  openrouter: [
    // { id: "anthropic/claude-3-opus", name: "Claude 3 Opus" },
    // { id: "anthropic/claude-3-sonnet", name: "Claude 3 Sonnet" },
    { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku" },
    { id: "meta-llama/llama-3.3-70b-instruct", name: "Llama 3.3 70B" },
    { id: "mistralai/mixtral-8x7b-instruct", name: "Mixtral 8x7B" },
    {
      id: "deepseek/deepseek-r1-0528-qwen3-8b:free",
      name: "Deepseek R1 Qwen3 8B",
    },
  ],
};

export function ModelSelector({
  selectedModel,
  selectedProvider,
  onModelChange,
  onProviderChange,
}: ModelSelectorProps) {
  const handleProviderChange = (provider: string) => {
    onProviderChange(provider);
    // Set default model for the provider
    const defaultModel = MODELS[provider as keyof typeof MODELS][0]?.id;
    if (defaultModel) {
      onModelChange(defaultModel);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider-select">Provider</Label>
        <Select value={selectedProvider} onValueChange={handleProviderChange}>
          <SelectTrigger id="provider-select">
            <SelectValue placeholder="Select a provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="google">Google AI</SelectItem>
            <SelectItem value="openrouter">OpenRouter</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="model-select">Model</Label>
        <Select value={selectedModel} onValueChange={onModelChange}>
          <SelectTrigger id="model-select">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {MODELS[selectedProvider as keyof typeof MODELS]?.map((model) => (
              <SelectItem key={model.id} value={model.id}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
