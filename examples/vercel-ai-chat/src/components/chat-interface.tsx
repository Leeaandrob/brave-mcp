'use client';

import { useState } from 'react';
import { useChat } from 'ai/react';
import { Send } from 'lucide-react';

export function ChatInterface() {
  const [searchType, setSearchType] = useState('web');
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  const enhancedHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    let toolName;
    switch (searchType) {
      case 'image':
        toolName = 'brave_image_search';
        break;
      case 'video':
        toolName = 'brave_video_search';
        break;
      case 'news':
        toolName = 'brave_news_search';
        break;
      default:
        toolName = 'brave_web_search';
    }

    await handleSubmit(e, {
      body: {
        messages: [
          {
            role: 'user',
            content: input,
            toolInvocations: [
              {
                toolName,
                parameters: { query: input, count: 5 },
              },
            ],
          },
        ],
      },
    });
  };

  return (
    <div className="flex flex-col h-[600px] max-w-4xl mx-auto border rounded-lg bg-white shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Ask me anything! I can search the web, news, images, and videos using Brave Search.</p>
            <p className="text-sm mt-2">Try: "What's the latest news about AI?" or "Show me images of cats"</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.toolInvocations?.map((tool, index) => (
                <div key={index} className="mt-3 p-2 bg-gray-50 rounded border text-sm">
                  <div className="font-semibold text-blue-600 mb-1">
                    🔍 Searching with {tool.toolName}
                  </div>
                  {tool.state === 'result' && (
                    <div className="text-gray-600">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(tool.result, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={enhancedHandleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Ask me anything..."
              className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex gap-4 justify-center">
            <label>
              <input
                type="radio"
                value="web"
                checked={searchType === 'web'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              Web
            </label>
            <label>
              <input
                type="radio"
                value="news"
                checked={searchType === 'news'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              News
            </label>
            <label>
              <input
                type="radio"
                value="image"
                checked={searchType === 'image'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              Images
            </label>
            <label>
              <input
                type="radio"
                value="video"
                checked={searchType === 'video'}
                onChange={(e) => setSearchType(e.target.value)}
              />
              Videos
            </label>
          </div>
        </form>
      </div>
    </div>
  );
}