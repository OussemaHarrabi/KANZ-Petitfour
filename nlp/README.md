# KANZ NLP & Sentiment Analysis

News scraping and sentiment analysis for Tunisian financial news.

## Architecture

```
nlp/
├── scrapers/
│   ├── news_scrapers.py     # News scraping classes
│   └── scheduler.py         # Background scraping scheduler
│
├── sentiment/
│   └── analyzer.py          # Sentiment analysis
│
├── data/                    # Cache directory
│
└── requirements.txt
```

## News Sources

| Source | URL | Language | Content |
|--------|-----|----------|---------|
| Webmanagercenter | webmanagercenter.com | French | Business news |
| Businessnews | businessnews.com.tn | French | Economic news |
| Ilboursa | ilboursa.com | French | BVMT-specific |
| RadioExpress | radioexpressfm.com | French | General news |

## Quick Start

```bash
cd nlp
pip install -r requirements.txt
```

## Usage

### Scrape News

```python
from scrapers.news_scrapers import NewsAggregator

aggregator = NewsAggregator()

# Get news for a stock
articles = aggregator.get_news_for_stock('SFBT')

# Get market news
market_news = aggregator.get_market_news()
```

### Analyze Sentiment

```python
from sentiment.analyzer import SentimentService

service = SentimentService()

# Analyze text
result = service.analyze_single_text("SFBT annonce une hausse de 15%")
# {'score': 0.6, 'label': 'positive', 'confidence': 0.85}

# Analyze stock sentiment
sentiment = service.get_stock_sentiment('SFBT', articles)
```

## Sentiment Model

Primary: `nlptown/bert-base-multilingual-uncased-sentiment`
- Returns 1-5 stars → converted to -1 to +1 score
- Handles French and Arabic

Fallback: Rule-based with French/Arabic keyword lists

## Output Format

### Stock Sentiment
```json
{
    "stock": "SFBT",
    "score": 0.45,
    "label": "positive",
    "confidence": 0.72,
    "article_count": 5
}
```

### Market Sentiment
```json
{
    "score": 0.15,
    "label": "bullish",
    "confidence": 0.8,
    "stocks_with_news": 12
}
```

## Stock Keywords

```python
STOCK_KEYWORDS = {
    'SFBT': ['SFBT', 'Société Frigorifique', 'Brasserie de Tunis'],
    'BIAT': ['BIAT', 'Banque Internationale Arabe'],
    'BT': ['Banque de Tunisie'],
    ...
}
```

## Backend Integration

The backend imports these modules:

```python
# backend/app/services/sentiment.py
from nlp.scrapers.news_scrapers import NewsAggregator
from nlp.sentiment.analyzer import SentimentService

aggregator = NewsAggregator()
service = SentimentService()

def get_stock_sentiment(stock_code: str) -> dict:
    articles = aggregator.get_news_for_stock(stock_code)
    return service.get_stock_sentiment(stock_code, articles)
```

## Dependencies

- `requests` + `beautifulsoup4` - Web scraping
- `transformers` - HuggingFace models
- `torch` - PyTorch backend
