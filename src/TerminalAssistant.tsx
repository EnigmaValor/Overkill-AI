import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  command?: string;
  isExecutable?: boolean;
}

interface TerminalAssistantProps {
  className?: string;
}

const TerminalAssistant: React.FC<TerminalAssistantProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hej! Jeg er din AI Terminal Assistant. Jeg kan hjælpe dig med Linux kommandoer, installation af programmer, og meget mere. Hvad har du brug for hjælp til?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickCommands = [
    { label: 'Liste filer', command: 'ls -la', description: 'Vis alle filer' },
    { label: 'System info', command: 'uname -a', description: 'System information' },
    { label: 'Hukommelse', command: 'free -h', description: 'RAM forbrug' },
    { label: 'Disk plads', command: 'df -h', description: 'Disk forbrug' },
    { label: 'Opdater', command: 'sudo apt update', description: 'Opdater pakker' },
    { label: 'Git status', command: 'git status', description: 'Git status' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getCommandSuggestion = (userInput: string): { command: string; explanation: string; isExecutable: boolean } => {
    const input = userInput.toLowerCase();
    
    // Pakke management kommandoer
    if (input.includes('install') || input.includes('installer')) {
      if (input.includes('apt') || input.includes('ubuntu') || input.includes('debian')) {
        return {
          command: 'sudo apt update && sudo apt install [pakkenavn]',
          explanation: 'Installerer en pakke via apt package manager',
          isExecutable: false
        };
      } else if (input.includes('snap')) {
        return {
          command: 'sudo snap install [pakkenavn]',
          explanation: 'Installerer en snap pakke',
          isExecutable: false
        };
      } else if (input.includes('flatpak')) {
        return {
          command: 'flatpak install [pakkenavn]',
          explanation: 'Installerer en flatpak pakke',
          isExecutable: false
        };
      } else if (input.includes('npm') || input.includes('node')) {
        return {
          command: 'npm install [pakkenavn]',
          explanation: 'Installerer en Node.js pakke',
          isExecutable: false
        };
      } else if (input.includes('pip') || input.includes('python')) {
        return {
          command: 'pip install [pakkenavn]',
          explanation: 'Installerer en Python pakke',
          isExecutable: false
        };
      } else {
        return {
          command: 'sudo apt install [pakkenavn]',
          explanation: 'Standard kommando til at installere pakker',
          isExecutable: false
        };
      }
    }

    if (input.includes('fjern') || input.includes('slet') || input.includes('uninstall')) {
      if (input.includes('npm') || input.includes('node')) {
        return {
          command: 'npm uninstall [pakkenavn]',
          explanation: 'Fjerner en Node.js pakke',
          isExecutable: false
        };
      } else if (input.includes('pip') || input.includes('python')) {
        return {
          command: 'pip uninstall [pakkenavn]',
          explanation: 'Fjerner en Python pakke',
          isExecutable: false
        };
      } else {
        return {
          command: 'sudo apt remove [pakkenavn]',
          explanation: 'Fjerner en installeret pakke',
          isExecutable: false
        };
      }
    }

    if (input.includes('opdater') || input.includes('update')) {
      return {
        command: 'sudo apt update && sudo apt upgrade',
        explanation: 'Opdaterer alle pakker til nyeste version',
        isExecutable: true
      };
    }

    // Fil og mappe kommandoer
    if (input.includes('liste') || input.includes('vis') || input.includes('ls')) {
      return {
        command: 'ls -la',
        explanation: 'Viser indholdet af den nuværende mappe med detaljer',
        isExecutable: true
      };
    }

    if (input.includes('gå til') || input.includes('cd')) {
      return {
        command: 'cd [mappestien]',
        explanation: 'Skifter til en anden mappe',
        isExecutable: false
      };
    }

    if (input.includes('opret mappe') || input.includes('ny mappe')) {
      return {
        command: 'mkdir [mappenavn]',
        explanation: 'Opretter en ny mappe',
        isExecutable: false
      };
    }

    if (input.includes('slet fil') || input.includes('fjern fil')) {
      return {
        command: 'rm [filnavn]',
        explanation: 'Sletter en fil (vær forsigtig!)',
        isExecutable: false
      };
    }

    // System kommandoer
    if (input.includes('hukommelse') || input.includes('ram') || input.includes('memory')) {
      return {
        command: 'free -h',
        explanation: 'Viser hukommelsesforbrug',
        isExecutable: true
      };
    }

    if (input.includes('disk') || input.includes('plads') || input.includes('space')) {
      return {
        command: 'df -h',
        explanation: 'Viser diskforbrug',
        isExecutable: true
      };
    }

    if (input.includes('processer') || input.includes('processes')) {
      return {
        command: 'ps aux',
        explanation: 'Viser alle kørende processer',
        isExecutable: true
      };
    }

    if (input.includes('netværk') || input.includes('network')) {
      return {
        command: 'ip addr show',
        explanation: 'Viser netværkskonfiguration',
        isExecutable: true
      };
    }

    // Git kommandoer
    if (input.includes('git') && input.includes('status')) {
      return {
        command: 'git status',
        explanation: 'Viser git repository status',
        isExecutable: true
      };
    }

    if (input.includes('git') && input.includes('clone')) {
      return {
        command: 'git clone [repository-url]',
        explanation: 'Kloner et git repository',
        isExecutable: false
      };
    }

    // Docker kommandoer
    if (input.includes('docker') && input.includes('images')) {
      return {
        command: 'docker images',
        explanation: 'Viser alle Docker images',
        isExecutable: true
      };
    }

    if (input.includes('docker') && input.includes('containers')) {
      return {
        command: 'docker ps -a',
        explanation: 'Viser alle Docker containere',
        isExecutable: true
      };
    }

    // Permissions og sikkerhed
    if (input.includes('tilladelse') || input.includes('permission') || input.includes('chmod')) {
      return {
        command: 'chmod [permissions] [filnavn]',
        explanation: 'Ændrer fil tilladelser (fx chmod 755 filnavn)',
        isExecutable: false
      };
    }

    if (input.includes('ejer') || input.includes('owner') || input.includes('chown')) {
      return {
        command: 'sudo chown [bruger]:[gruppe] [filnavn]',
        explanation: 'Ændrer ejer af en fil eller mappe',
        isExecutable: false
      };
    }

    // Søgning
    if (input.includes('find') || input.includes('søg') || input.includes('findes')) {
      return {
        command: 'find . -name "[filnavn]" -type f',
        explanation: 'Søger efter filer med et bestemt navn',
        isExecutable: false
      };
    }

    if (input.includes('grep') || input.includes('søg i')) {
      return {
        command: 'grep -r "tekst" [mappe]',
        explanation: 'Søger efter tekst i filer',
        isExecutable: false
      };
    }

    // System information
    if (input.includes('os') || input.includes('version') || input.includes('system')) {
      return {
        command: 'uname -a && lsb_release -a',
        explanation: 'Viser system information og OS version',
        isExecutable: true
      };
    }

    if (input.includes('cpu') || input.includes('processor')) {
      return {
        command: 'lscpu',
        explanation: 'Viser CPU information',
        isExecutable: true
      };
    }

    // Generel hjælp
    return {
      command: 'man [kommando]',
      explanation: 'Viser manual for en kommando',
      isExecutable: false
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simuler AI response
    setTimeout(() => {
      const suggestion = getCommandSuggestion(input);
      
      const assistantMessage: Message = {
        id: generateId(),
        type: 'assistant',
        content: `Jeg forstår du vil ${input.toLowerCase()}. Her er min anbefaling:`,
        timestamp: new Date(),
        command: suggestion.command,
        isExecutable: suggestion.isExecutable
      };

      const explanationMessage: Message = {
        id: generateId(),
        type: 'system',
        content: `💡 **Forklaring:** ${suggestion.explanation}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage, explanationMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const executeCommand = async (command: string) => {
    if (!command) return;

    const confirmMessage: Message = {
      id: generateId(),
      type: 'system',
      content: `⚠️ **Advarsel:** Du er ved at køre kommandoen: \`${command}\`\n\nEr du sikker på at du vil fortsætte?`,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, confirmMessage]);

    // I en rigtig applikation ville her være en backend der kører kommandoen
    // For nu simulerer vi bare
    setTimeout(() => {
      const resultMessage: Message = {
        id: generateId(),
        type: 'system',
        content: `✅ Kommandoen \`${command}\` blev kørt succesfuldt!\n\n*Note: I en rigtig applikation ville her være output fra terminalen.*`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, resultMessage]);
    }, 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('da-DK', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold text-green-400">🤖 AI Terminal Assistant</h1>
        <p className="text-sm text-gray-400">Din personlige Linux terminal hjælper</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-2 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'assistant'
                  ? 'bg-gray-700 text-white'
                  : 'bg-yellow-900 text-yellow-100 border border-yellow-600'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">
                  {message.type === 'user' ? 'Dig' : message.type === 'assistant' ? 'AI Assistant' : 'System'}
                </span>
                <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {message.command && (
                <div className="mt-3 p-3 bg-gray-800 rounded border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <code className="text-green-400 font-mono text-sm">{message.command}</code>
                    </div>
                    {message.isExecutable && (
                      <button
                        onClick={() => executeCommand(message.command!)}
                        className="ml-4 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                      >
                        Kør kommando
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>AI tænker...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Spørg mig om Linux kommandoer, installation af programmer, eller hvad som helst..."
            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:border-green-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Send
          </button>
        </form>
        
        <div className="mt-2 text-xs text-gray-400">
          💡 Prøv at spørge: "hvordan installerer jeg vim", "vis mine filer", "opdater systemet"
        </div>
        
        {/* Quick Commands */}
        <div className="mt-3">
          <div className="text-xs text-gray-400 mb-2">Hurtige kommandoer:</div>
          <div className="flex flex-wrap gap-2">
            {quickCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(cmd.command);
                  handleSubmit(new Event('submit') as any);
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded border border-gray-600 transition-colors"
                title={cmd.description}
              >
                {cmd.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalAssistant;