"""
BVMT News Scrapers
Scrape financial news from Tunisian sources for sentiment analysis.
Supports French and Arabic news sources.
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import time
import re
import json
from pathlib import Path


STOCK_KEYWORDS_AR = {
    'SFBT': ['سفبت', 'الشركة التونسية للمشروبات', 'مصانع الجعة بتونس', 'مشروبات تونس'],
    'BIAT': ['بيات', 'البنك الدولي العربي التونسي', 'بنك تونس العربي', 'نتائج بنكية', 'قروض'],
    'BT': ['بنك تونس', 'البنك التونسي', 'أرباح البنك', 'القطاع البنكي'],
    'ATTIJARI BANK': ['التجاري بنك', 'بنك التجاري وفا', 'التجاري وفا بنك'],
    'STB': ['ستب', 'الشركة التونسية للبنك', 'إعادة هيكلة', 'خسائر', 'دعم حكومي'],
    'BNA': ['بنك ب ن أ', 'البنك الوطني الفلاحي', 'تمويل فلاحي', 'قروض فلاحية', 'استثمارات فلاحية', 'دعم القطاع الزراعي'],
    'AMEN BANK': ['أمن بنك', 'بنك الأمان'],
    'UIB': ['يو آي بي', 'الاتحاد الدولي للبنوك', 'قروض استهلاكية'],
    'SAH': ['سه', 'ليلاس', 'سه ليلاس', 'مواد تجميل ليلاس', 'سوق مواد التجميل', 'منتجات صحية'],
    'DELICE HOLDING': ['دليس', 'دليس هولدينغ', 'منتجات الألبان بتونس', 'دانون تونس', 'قطاع الألبان'],
    'POULINA GP HOLDING': ['بولينا', 'مجموعة بولينا', 'قطاع الدواجن', 'استثمار', 'أرباح', 'نتائج مالية'],
    'ONE TECH HOLDING': ['وان تك', 'وان تك هولدينغ', 'صادرات صناعية', 'توسع صناعي'],
    'CARTHAGE CEMENT': ['إسمنت قرطاج', 'قطاع الإسمنت', 'مشاريع بنية تحتية'],
    'EURO-CYCLES': ['يورو سايكل', 'صادرات', 'مبيعات', 'نتائج مالية', 'أرباح'],
    'SOTUVER': ['سوتوفير', 'صناعة الزجاج', 'نتائج مالية', 'أرباح', 'طلب صناعي'],
    'TUNINDEX': ['توننداكس', 'بورصة تونس', 'السوق المالية التونسية', 'ارتفاع المؤشر', 'انخفاض المؤشر', 'تداول', 'رسملة سوقية'],
}

STOCK_KEYWORDS = {
    'SFBT': ['SFBT', 'Societe Frigorifique', 'Brasserie de Tunis', 'boisson'],
    'BIAT': ['BIAT', 'Banque Internationale Arabe', 'banque arabe tunisie'],
    'BT': ['Banque de Tunisie', 'BT banque'],
    'ATTIJARI BANK': ['Attijari', 'Attijari Bank', 'Wafa'],
    'STB': ['STB', 'Societe Tunisienne de Banque'],
    'BNA': ['BNA', 'Banque Nationale Agricole'],
    'AMEN BANK': ['Amen Bank', 'Amen banque'],
    'UIB': ['UIB', 'Union Internationale de Banques'],
    'SAH': ['SAH', 'Lilas', 'SAH Lilas', 'cosmetique lilas'],
    'DELICE HOLDING': ['Delice', 'Delice Holding', 'laitier tunisie', 'Danone'],
    'POULINA GP HOLDING': ['Poulina', 'Poulina Group', 'aviculture'],
    'ONE TECH HOLDING': ['One Tech', 'One Tech Holding', 'cablage'],
    'CARTHAGE CEMENT': ['Carthage Cement', 'ciment carthage'],
    'EURO-CYCLES': ['Euro Cycles', 'Euro-Cycles', 'velo tunisie'],
    'SOTUVER': ['Sotuver', 'verre tunisie', 'emballage verre'],
    'TUNINDEX': ['TUNINDEX', 'bourse tunis', 'BVMT', 'marche tunisien'],
}


class BaseScraper:
    def __init__(self, base_url: str, rate_limit: float = 1.0):
        self.base_url = base_url
        self.rate_limit = rate_limit
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7,ar;q=0.6',
        })
    
    def _get(self, url: str) -> Optional[BeautifulSoup]:
        try:
            response = self.session.get(url, timeout=(10, 20))
            response.raise_for_status()
            time.sleep(self.rate_limit)
            return BeautifulSoup(response.text, 'lxml')
        except KeyboardInterrupt:
            raise
        except Exception as e:
            print(f"[WARN] Error fetching {url}: {e}")
            return None
    
    def search(self, keyword: str, max_pages: int = 3) -> List[Dict]:
        raise NotImplementedError
    
    def parse_article(self, url: str) -> Optional[Dict]:
        raise NotImplementedError


class WebManagerScraper(BaseScraper):
    def __init__(self):
        super().__init__('https://www.webmanagercenter.com')
    
    def search(self, keyword: str, max_pages: int = 3) -> List[Dict]:
        articles = []
        
        for page in range(1, max_pages + 1):
            search_url = f"{self.base_url}/?s={keyword}&paged={page}"
            soup = self._get(search_url)
            
            if not soup:
                continue
            
            article_elements = soup.select('h3 a[href*="webmanagercenter.com"]')
            
            for link in article_elements[:15]:
                href = link.get('href', '')
                title_text = link.get_text(strip=True)
                
                if href and title_text and len(title_text) > 10:
                    date_str = datetime.now().strftime('%Y-%m-%d')
                    date_match = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', href)
                    if date_match:
                        date_str = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
                    
                    articles.append({
                        'url': href,
                        'title': title_text,
                        'date': date_str,
                        'source': 'webmanagercenter',
                        'language': 'fr'
                    })
        
        return articles
    
    def parse_article(self, url: str) -> Optional[Dict]:
        soup = self._get(url)
        if not soup:
            return None
        
        title = soup.select_one('h1, .entry-title')
        date = soup.select_one('time, .date')
        content_div = soup.select_one('.td-post-content')
        
        if not title or not content_div:
            return None
        
        paragraphs = content_div.find_all('p')
        text = ' '.join(p.get_text(strip=True) for p in paragraphs)
        
        return {
            'url': url,
            'title': title.get_text(strip=True),
            'content': text[:5000],
            'date': self._parse_date(date.get_text(strip=True) if date else ''),
            'source': 'webmanagercenter',
            'language': 'fr'
        }
    
    def _parse_date(self, date_str: str) -> str:
        try:
            for fmt in ['%d/%m/%Y', '%Y-%m-%d', '%d %B %Y', '%B %d, %Y']:
                try:
                    dt = datetime.strptime(date_str.strip(), fmt)
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue
        except:
            pass
        return datetime.now().strftime('%Y-%m-%d')


class BusinessNewsScraper(BaseScraper):
    def __init__(self):
        super().__init__('https://businessnews.com.tn')
    
    def search(self, keyword: str, max_pages: int = 3) -> List[Dict]:
        articles = []
        
        for page in range(1, max_pages + 1):
            if page == 1:
                search_url = f"{self.base_url}/?s={keyword}"
            else:
                search_url = f"{self.base_url}/page/{page}/?s={keyword}"
            
            soup = self._get(search_url)
            if not soup:
                continue
            
            article_elements = soup.select('article, .post, .entry, h3 a, h2 a')
            
            for el in article_elements[:15]:
                if el.name == 'a':
                    link = el
                    title_text = el.get_text(strip=True)
                else:
                    link = el.select_one('a[href]')
                    title_el = el.select_one('h2, h3, .entry-title, .title')
                    title_text = title_el.get_text(strip=True) if title_el else ''
                
                if link and title_text and len(title_text) > 10:
                    href = link.get('href', '')
                    if not href.startswith('http'):
                        href = self.base_url + href
                    
                    date_str = datetime.now().strftime('%Y-%m-%d')
                    date_match = re.search(r'/(\d{4})/(\d{2})/(\d{2})/', href)
                    if date_match:
                        date_str = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
                    
                    articles.append({
                        'url': href,
                        'title': title_text,
                        'date': date_str,
                        'source': 'businessnews',
                        'language': 'fr'
                    })
        
        return articles
    
    def parse_article(self, url: str) -> Optional[Dict]:
        soup = self._get(url)
        if not soup:
            return None
        
        title = soup.select_one('h1')
        content = soup.select_one('.article-content, .content, article')
        
        if not title or not content:
            return None
        
        paragraphs = content.find_all('p')
        text = ' '.join(p.get_text(strip=True) for p in paragraphs)
        
        return {
            'url': url,
            'title': title.get_text(strip=True),
            'content': text[:5000],
            'date': datetime.now().strftime('%Y-%m-%d'),
            'source': 'businessnews',
            'language': 'fr'
        }


class IlboursaScraper(BaseScraper):
    def __init__(self):
        super().__init__('https://www.ilboursa.com')
    
    def search(self, keyword: str, max_pages: int = 3) -> List[Dict]:
        articles = []
        
        soup = None
        if ' ' not in keyword:
            news_url = f"{self.base_url}/marches/news_valeur?s={keyword}"
            soup = self._get(news_url)
        
        if soup:
            news_links = soup.select('a[href*="/marches/"]')
            for link in news_links[:20]:
                href = link.get('href', '')
                if not href.startswith('http'):
                    href = self.base_url + href
                
                title = link.get_text(strip=True)
                if (title and len(title) > 15 
                    and 'cotation' not in href 
                    and 'graph' not in href
                    and 'societe' not in href
                    and 'historiques' not in href
                    and 'secteur' not in href
                    and 'news_valeur' not in href
                    and 'aaz' not in href):
                    
                    date_str = datetime.now().strftime('%Y-%m-%d')
                    parent = link.parent
                    if parent:
                        parent_text = parent.get_text()
                        date_match = re.search(r'(\d{2})/(\d{2})/(\d{2,4})', parent_text)
                        if date_match:
                            year = date_match.group(3)
                            if len(year) == 2:
                                year = '20' + year
                            date_str = f"{year}-{date_match.group(2)}-{date_match.group(1)}"
                    
                    articles.append({
                        'url': href,
                        'title': title,
                        'date': date_str,
                        'source': 'ilboursa',
                        'language': 'fr'
                    })
        
        search_url = f"{self.base_url}/search?q={keyword}"
        soup = self._get(search_url)
        
        if soup:
            result_links = soup.select('a.gs-title, .gsc-thumbnail-inside a, .gs-snippet a, a[href*="ilboursa.com/marches/"]')
            for link in result_links[:10]:
                href = link.get('href', '')
                if not href.startswith('http'):
                    href = self.base_url + href
                
                title = link.get_text(strip=True)
                if title and len(title) > 10 and href not in [a['url'] for a in articles]:
                    articles.append({
                        'url': href,
                        'title': title,
                        'date': datetime.now().strftime('%Y-%m-%d'),
                        'source': 'ilboursa',
                        'language': 'fr'
                    })
        
        return articles
    
    def parse_article(self, url: str) -> Optional[Dict]:
        soup = self._get(url)
        if not soup:
            return None
        
        title = soup.select_one('h1, .title')
        content = soup.select_one('.content, article, .article-body')
        
        if not title:
            return None
        
        text = content.get_text(strip=True) if content else ''
        
        return {
            'url': url,
            'title': title.get_text(strip=True),
            'content': text[:5000],
            'date': datetime.now().strftime('%Y-%m-%d'),
            'source': 'ilboursa',
            'language': 'fr'
        }


class RadioExpressFMScraper(BaseScraper):
    def __init__(self):
        super().__init__('https://radioexpressfm.com')
        self.session.headers.update({
            'Referer': 'https://radioexpressfm.com/ar/',
        })
    
    def search(self, keyword: str, max_pages: int = 3) -> List[Dict]:
        articles = []
        ar_keywords = STOCK_KEYWORDS_AR.get(keyword, [keyword])
        
        for ar_kw in ar_keywords[:2]:
            for page in range(1, max_pages + 1):
                if page == 1:
                    url = f"{self.base_url}/ar/?s={ar_kw}"
                else:
                    url = f"{self.base_url}/ar/page/{page}/?s={ar_kw}"
                
                soup = self._get(url)
                if not soup:
                    break
                
                article_links = soup.select('h3 a[href*="radioexpressfm.com"]')
                
                if not article_links:
                    break
                
                for link in article_links[:15]:
                    href = link.get('href', '')
                    title = link.get_text(strip=True)
                    
                    if (title and len(title) > 10
                        and '/ar/' in href
                        and '/podcast/' not in href
                        and '/radiochannel/' not in href
                        and href != 'https://radioexpressfm.com/ar/'):
                        
                        date_str = datetime.now().strftime('%Y-%m-%d')
                        date_match = re.search(r'/(\d{4})/(\d{2})/', href)
                        if date_match:
                            date_str = f"{date_match.group(1)}-{date_match.group(2)}-01"
                        
                        parent = link.parent
                        if parent:
                            prev = parent.find_previous_sibling()
                            if prev:
                                prev_text = prev.get_text()
                                dm = re.search(r'(\d{2})/(\d{2})/(\d{4})', prev_text)
                                if dm:
                                    date_str = f"{dm.group(3)}-{dm.group(2)}-{dm.group(1)}"
                        
                        if href not in [a['url'] for a in articles]:
                            articles.append({
                                'url': href,
                                'title': title,
                                'date': date_str,
                                'source': 'radioexpressfm',
                                'language': 'ar'
                            })
                
                time.sleep(self.rate_limit)
        
        return articles
    
    def parse_article(self, url: str) -> Optional[Dict]:
        soup = self._get(url)
        if not soup:
            return None
        
        title = soup.select_one('h1')
        content_div = (soup.select_one('.proradio-the_content') 
                      or soup.select_one('.proradio-entrycontent')
                      or soup.select_one('.td-post-content'))
        
        if not title or not content_div:
            return None
        
        paragraphs = content_div.find_all('p')
        text = ' '.join(p.get_text(strip=True) for p in paragraphs)
        
        return {
            'url': url,
            'title': title.get_text(strip=True),
            'content': text[:5000],
            'date': datetime.now().strftime('%Y-%m-%d'),
            'source': 'radioexpressfm',
            'language': 'ar'
        }


class NewsAggregator:
    def __init__(self, cache_dir: str = 'nlp/data'):
        self.scrapers = {
            'webmanagercenter': WebManagerScraper(),
            'businessnews': BusinessNewsScraper(),
            'radioexpressfm': RadioExpressFMScraper(),
        }
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get_news_for_stock(self, stock_code: str, days_back: int = 7) -> List[Dict]:
        keywords = STOCK_KEYWORDS.get(stock_code, [stock_code])
        all_articles = []
        
        for keyword in keywords[:2]:
            for name, scraper in self.scrapers.items():
                try:
                    articles = scraper.search(keyword, max_pages=2)
                    all_articles.extend(articles)
                except Exception as e:
                    print(f"[WARN] Error with {name} scraper: {e}")
        
        seen_urls = set()
        unique_articles = []
        for article in all_articles:
            if article['url'] not in seen_urls:
                seen_urls.add(article['url'])
                article['stock_code'] = stock_code
                unique_articles.append(article)
        
        return unique_articles[:90]
    
    def get_full_article(self, article: Dict) -> Optional[Dict]:
        source = article.get('source', '')
        url = article.get('url', '')
        
        if source in self.scrapers:
            return self.scrapers[source].parse_article(url)
        
        return None
    
    def get_market_news(self, days_back: int = 1) -> List[Dict]:
        return self.get_news_for_stock('TUNINDEX', days_back)
    
    def save_cache(self, articles: List[Dict], filename: str = 'news_cache.json'):
        cache_path = self.cache_dir / filename
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(articles, f, ensure_ascii=False, indent=2)
        print(f"[OK] Saved {len(articles)} articles to {cache_path}")
    
    def load_cache(self, filename: str = 'news_cache.json') -> List[Dict]:
        cache_path = self.cache_dir / filename
        if cache_path.exists():
            with open(cache_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []


if __name__ == '__main__':
    print("[TEST] Scraping news for all stocks...")
    
    aggregator = NewsAggregator()
    all_articles = []
    
    for stock_code in STOCK_KEYWORDS:
        print(f"\n[INFO] Fetching {stock_code} news...")
        articles = aggregator.get_news_for_stock(stock_code)
        print(f"   Found {len(articles)} articles for {stock_code}")
        all_articles.extend(articles)
    
    seen_urls = set()
    unique_articles = []
    for article in all_articles:
        if article['url'] not in seen_urls:
            seen_urls.add(article['url'])
            unique_articles.append(article)
    
    print(f"\n[INFO] Fetching full content for {len(unique_articles)} articles...")
    for i, article in enumerate(unique_articles, 1):
        print(f"   [{i}/{len(unique_articles)}] {article['title'][:60]}...")
        full = aggregator.get_full_article(article)
        if full and full.get('content'):
            article['description'] = full['content']
        else:
            article['description'] = ''
    
    print(f"\n[RESULT] Total unique articles: {len(unique_articles)}")
    aggregator.save_cache(unique_articles, 'ilboursa_stocks.json')
