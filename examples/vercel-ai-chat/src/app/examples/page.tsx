'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SearchExample {
  title: string;
  description: string;
  searchType: 'web' | 'news' | 'images' | 'videos';
  query: string;
  parameters?: Record<string, any>;
}

const searchExamples: SearchExample[] = [
  // Web Search Examples
  {
    title: 'General Web Search',
    description: 'Search for general information about Claude AI',
    searchType: 'web',
    query: 'Claude AI anthropic features',
    parameters: { count: 5 }
  },
  {
    title: 'Technical Documentation',
    description: 'Find technical documentation and guides',
    searchType: 'web',
    query: 'React hooks useEffect tutorial',
    parameters: { count: 8 }
  },
  
  // News Search Examples
  {
    title: 'Recent Tech News',
    description: 'Latest technology news from the past week',
    searchType: 'news',
    query: 'artificial intelligence breakthrough',
    parameters: { count: 6, freshness: 'pw' }
  },
  {
    title: 'Breaking News Today',
    description: 'Breaking news from the past day',
    searchType: 'news',
    query: 'technology companies earnings',
    parameters: { count: 5, freshness: 'pd' }
  },
  
  // Image Search Examples
  {
    title: 'High-Quality Images',
    description: 'Search for large, high-quality images',
    searchType: 'images',
    query: 'modern web design inspiration',
    parameters: { count: 10, size: 'large' }
  },
  {
    title: 'Wallpaper Images',
    description: 'Find wallpaper-sized images',
    searchType: 'images',
    query: 'minimalist desktop wallpaper',
    parameters: { count: 8, size: 'wallpaper' }
  },
  
  // Video Search Examples
  {
    title: 'Tutorial Videos',
    description: 'Find educational tutorial videos',
    searchType: 'videos',
    query: 'JavaScript async await tutorial',
    parameters: { count: 5, duration: 'medium' }
  },
  {
    title: 'Short Form Content',
    description: 'Quick video explanations',
    searchType: 'videos',
    query: 'CSS flexbox explained',
    parameters: { count: 6, duration: 'short' }
  }
];

export default function ExamplesPage() {
  const [selectedExample, setSelectedExample] = useState<SearchExample | null>(null);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const executeSearch = async (example: SearchExample) => {
    setSelectedExample(example);
    setLoading(true);
    setSearchResult(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: example.searchType,
          query: example.query,
          ...example.parameters
        })
      });

      const result = await response.json();
      setSearchResult(result);
    } catch (error) {
      setSearchResult({ error: 'Failed to execute search' });
    } finally {
      setLoading(false);
    }
  };

  const getSearchTypeIcon = (type: string) => {
    switch (type) {
      case 'web': return '🌐';
      case 'news': return '📰';
      case 'images': return '🖼️';
      case 'videos': return '🎥';
      default: return '🔍';
    }
  };

  const getSearchTypeColor = (type: string) => {
    switch (type) {
      case 'web': return 'bg-blue-100 text-blue-800';
      case 'news': return 'bg-green-100 text-green-800';
      case 'images': return 'bg-purple-100 text-purple-800';
      case 'videos': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Brave Search API Examples
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Explore different search types and see how they work with various parameters
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Chat
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Examples List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Search Examples
            </h2>
            
            {searchExamples.map((example, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => executeSearch(example)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {getSearchTypeIcon(example.searchType)}
                      </span>
                      <h3 className="font-medium text-gray-900">
                        {example.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSearchTypeColor(example.searchType)}`}>
                        {example.searchType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {example.description}
                    </p>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Query:</span>
                      <span className="ml-1 text-gray-600 font-mono bg-gray-100 px-1 rounded">
                        {example.query}
                      </span>
                    </div>
                    {example.parameters && Object.keys(example.parameters).length > 0 && (
                      <div className="text-sm mt-1">
                        <span className="font-medium text-gray-700">Parameters:</span>
                        <span className="ml-1 text-gray-600">
                          {JSON.stringify(example.parameters)}
                        </span>
                      </div>
                    )}
                  </div>
                  <button className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                    Try It
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Results Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results
              </h2>
            </div>
            
            <div className="p-4">
              {!selectedExample && (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>Select an example to see search results</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Searching...</p>
                </div>
              )}

              {searchResult && !loading && (
                <div className="space-y-4">
                  {selectedExample && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getSearchTypeIcon(selectedExample.searchType)}</span>
                        <span className="font-medium">{selectedExample.title}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Query: <code className="bg-white px-1 rounded">{selectedExample.query}</code>
                      </div>
                    </div>
                  )}

                  {searchResult.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="text-red-800 font-medium mb-1">Error</div>
                      <div className="text-red-600 text-sm">{searchResult.error}</div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        Found {searchResult.results?.length || 0} results
                      </div>
                      
                      {searchResult.results?.slice(0, 5).map((result: any, index: number) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-blue-600 hover:text-blue-800">
                            <a href={result.url} target="_blank" rel="noopener noreferrer">
                              {result.title}
                            </a>
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                          <div className="text-xs text-gray-500 mt-2">
                            {result.source || new URL(result.url).hostname}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}