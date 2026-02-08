"""
News scraper scheduler - runs hourly to fetch news and compute sentiment scores.
Can be run as standalone script or imported for integration.
"""

import sys
import time
import threading
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Callable, Optional

NLP_ROOT = Path(__file__).parent.parent
if str(NLP_ROOT) not in sys.path:
    sys.path.insert(0, str(NLP_ROOT))

from scrapers.news_scrapers import NewsAggregator, STOCK_KEYWORDS
from sentiment.analyzer import SentimentAnalyzer


class NewsScheduler:
    def __init__(
        self,
        interval_seconds: int = 3600,
        on_news_callback: Optional[Callable[[List[Dict]], None]] = None,
    ):
        self.interval = interval_seconds
        self.aggregator = NewsAggregator()
        self.analyzer = SentimentAnalyzer()
        self.on_news = on_news_callback
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self.last_run: Optional[datetime] = None
        self.last_articles: List[Dict] = []

    def scrape_and_analyze(self) -> List[Dict]:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting news scrape...")
        
        all_articles = []
        for stock_code in STOCK_KEYWORDS:
            try:
                articles = self.aggregator.get_news_for_stock(stock_code, days_back=1)
                all_articles.extend(articles)
            except Exception as e:
                print(f"[WARN] Failed to scrape {stock_code}: {e}")
        
        seen_urls = set()
        unique_articles = []
        for article in all_articles:
            if article['url'] not in seen_urls:
                seen_urls.add(article['url'])
                unique_articles.append(article)
        
        print(f"[INFO] Fetching content for {len(unique_articles)} articles...")
        for article in unique_articles:
            try:
                full = self.aggregator.get_full_article(article)
                if full and full.get('content'):
                    article['description'] = full['content']
                else:
                    article['description'] = ''
            except Exception:
                article['description'] = ''
        
        print(f"[INFO] Analyzing sentiment for {len(unique_articles)} articles...")
        for article in unique_articles:
            text = f"{article.get('title', '')} {article.get('description', '')}"
            try:
                sentiment_result = self.analyzer.analyze(text)
                article['sentiment'] = sentiment_result['sentiment']
                article['sentiment_score'] = sentiment_result['score']
                article['sentiment_confidence'] = sentiment_result['confidence']
            except Exception:
                article['sentiment'] = 'neutral'
                article['sentiment_score'] = 0.0
                article['sentiment_confidence'] = 0.0
        
        self.aggregator.save_cache(unique_articles, 'news_cache.json')
        
        self.last_run = datetime.now()
        self.last_articles = unique_articles
        
        print(f"[OK] Scraped {len(unique_articles)} articles with sentiment scores")
        
        if self.on_news:
            try:
                self.on_news(unique_articles)
            except Exception as e:
                print(f"[WARN] Callback failed: {e}")
        
        return unique_articles

    def _run_loop(self):
        while self._running:
            try:
                self.scrape_and_analyze()
            except Exception as e:
                print(f"[ERROR] Scheduler run failed: {e}")
            
            for _ in range(self.interval):
                if not self._running:
                    break
                time.sleep(1)

    def start(self):
        if self._running:
            print("[WARN] Scheduler already running")
            return
        
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        print(f"[OK] News scheduler started (interval: {self.interval}s)")

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        print("[OK] News scheduler stopped")

    def run_once(self) -> List[Dict]:
        return self.scrape_and_analyze()


def run_scheduler(interval_hours: float = 1.0):
    scheduler = NewsScheduler(interval_seconds=int(interval_hours * 3600))
    
    print(f"[START] News scheduler running every {interval_hours} hour(s)")
    print("[INFO] Press Ctrl+C to stop")
    
    scheduler.start()
    
    try:
        while True:
            time.sleep(60)
    except KeyboardInterrupt:
        print("\n[STOP] Shutting down...")
        scheduler.stop()


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='BVMT News Scheduler')
    parser.add_argument('--interval', type=float, default=1.0, help='Scrape interval in hours')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    args = parser.parse_args()
    
    if args.once:
        scheduler = NewsScheduler()
        articles = scheduler.run_once()
        print(f"\n[DONE] Processed {len(articles)} articles")
        
        positives = sum(1 for a in articles if a.get('sentiment') == 'positive')
        negatives = sum(1 for a in articles if a.get('sentiment') == 'negative')
        neutrals = sum(1 for a in articles if a.get('sentiment') == 'neutral')
        print(f"[STATS] Positive: {positives}, Negative: {negatives}, Neutral: {neutrals}")
    else:
        run_scheduler(interval_hours=args.interval)
