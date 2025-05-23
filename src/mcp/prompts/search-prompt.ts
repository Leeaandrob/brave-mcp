export class SearchAnalysisPrompt {
  get definition() {
    return {
      name: 'search_and_analyze',
      description: 'Search for information using Brave Search and provide comprehensive analysis. This prompt guides the AI to perform research and deliver structured insights.',
      arguments: [
        {
          name: 'query',
          description: 'What to search for - the main topic or question',
          required: true,
        },
        {
          name: 'search_type',
          description: 'Type of search to perform: web, news, images, or videos',
          required: false,
        },
        {
          name: 'analysis_focus',
          description: 'What aspect to focus the analysis on (e.g., trends, facts, opinions, recent developments)',
          required: false,
        },
        {
          name: 'depth',
          description: 'Analysis depth: surface, detailed, or comprehensive',
          required: false,
        },
      ],
    };
  }

  async generate(args: any) {
    const { 
      query, 
      search_type = 'web', 
      analysis_focus = 'comprehensive insights and key findings',
      depth = 'detailed'
    } = args;
    
    const searchCount = this.getSearchCount(depth);
    const analysisInstructions = this.getAnalysisInstructions(depth, analysis_focus);
    
    const prompt = `
# Research and Analysis Task

You are a professional research assistant with access to Brave Search tools. Your task is to research "${query}" and provide ${depth} analysis.

## Research Instructions

1. **Primary Search**: Use the ${search_type}_search tool to find relevant information
   - Query: "${query}"
   - Count: ${searchCount} results
   - Focus on authoritative and recent sources

2. **Supplementary Research** (if needed):
   - If searching news, also check web results for broader context
   - If searching web, consider checking news for recent developments
   - Cross-reference information from multiple sources

3. **Source Evaluation**:
   - Prioritize authoritative sources (government, academic, established media)
   - Note publication dates and source credibility
   - Identify any potential bias or limitations

## Analysis Framework

${analysisInstructions}

## Output Structure

Provide your analysis in the following format:

### Executive Summary
- Brief overview of key findings
- Main conclusions and insights

### Detailed Findings
- Organized by themes or categories
- Include specific data, quotes, and examples
- Reference sources with URLs

### Analysis and Insights
- ${analysis_focus}
- Trends and patterns identified
- Implications and significance

### Sources and Credibility
- List of primary sources used
- Assessment of source quality and reliability
- Any limitations or gaps in available information

### Recommendations
- Suggested next steps or areas for further research
- Actionable insights based on findings

## Search Parameters
- Primary query: "${query}"
- Search type: ${search_type}
- Results per search: ${searchCount}
- Analysis focus: ${analysis_focus}
- Depth level: ${depth}

Begin your research now by using the appropriate search tool(s).
    `.trim();

    return {
      description: `Research and analyze: ${query} (${depth} ${search_type} analysis)`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: prompt,
          },
        },
      ],
    };
  }

  private getSearchCount(depth: string): number {
    switch (depth) {
      case 'surface': return 5;
      case 'detailed': return 10;
      case 'comprehensive': return 15;
      default: return 10;
    }
  }

  private getAnalysisInstructions(depth: string, focus: string): string {
    const baseInstructions = `Focus your analysis on: ${focus}`;
    
    switch (depth) {
      case 'surface':
        return `${baseInstructions}
- Provide a concise overview of the main points
- Highlight 3-5 key findings
- Keep analysis brief but informative`;

      case 'comprehensive':
        return `${baseInstructions}
- Conduct thorough analysis of all aspects
- Examine multiple perspectives and viewpoints
- Include historical context where relevant
- Analyze trends, patterns, and implications
- Consider broader impact and significance
- Provide detailed recommendations`;

      case 'detailed':
      default:
        return `${baseInstructions}
- Analyze key themes and patterns
- Examine different perspectives
- Provide context and background information
- Draw meaningful conclusions
- Offer practical insights`;
    }
  }
}
