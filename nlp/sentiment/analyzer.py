"""
BVMT Sentiment Analyzer
Analyze sentiment of French and Arabic financial news.
Enhanced with comprehensive financial vocabulary for Tunisian market.
"""

from typing import Dict, List, Optional, Union
from datetime import datetime
import numpy as np
import json
import re
from pathlib import Path


class SentimentAnalyzer:
    """
    Sentiment analysis for French and Arabic financial news.
    Uses HuggingFace transformers for multilingual sentiment detection.
    Enhanced rule-based fallback with comprehensive financial vocabulary.
    """
    
    # Comprehensive French positive financial words
    FRENCH_POSITIVE = [
        # Performance
        'hausse', 'augmentation', 'croissance', 'profit', 'benefice', 'bénéfice',
        'positif', 'succes', 'succès', 'progression', 'amelioration', 'amélioration',
        'record', 'gain', 'dividende', 'expansion', 'optimiste', 'favorable',
        'excellent', 'remarquable', 'performance', 'rentabilite', 'rentabilité',
        # Market indicators
        'rebond', 'reprise', 'rally', 'bullish', 'haussier', 'achat',
        'surperformance', 'outperform', 'recommandation achat', 'objectif relevé',
        # Financial health
        'solide', 'robuste', 'resilient', 'résilient', 'stable', 'sain',
        'liquidite', 'liquidité', 'solvabilite', 'solvabilité', 'tresorerie', 'trésorerie',
        # Growth
        'developpement', 'développement', 'innovation', 'investissement',
        'acquisition', 'partenariat', 'contrat', 'accord', 'signature',
        # Dividends & returns
        'distribution', 'rendement', 'retour', 'valorisation', 'capitalisation',
        # Positive actions
        'renforce', 'consolide', 'accelere', 'accélère', 'depasse', 'dépasse',
        'atteint', 'realise', 'réalise', 'confirme', 'maintient',
    ]
    
    # Comprehensive French negative financial words
    FRENCH_NEGATIVE = [
        # Performance
        'baisse', 'chute', 'perte', 'deficit', 'déficit', 'negatif', 'négatif',
        'crise', 'recul', 'degradation', 'dégradation', 'effondrement', 'faillite',
        'dette', 'risque', 'difficile', 'inquietude', 'inquiétude', 'pessimiste',
        'defavorable', 'défavorable',
        # Market indicators
        'correction', 'bearish', 'baissier', 'vente', 'sell', 'sous-performance',
        'underperform', 'objectif abaisse', 'objectif abaissé', 'downgrade',
        # Financial distress
        'insolvable', 'liquidation', 'restructuration', 'difficulte', 'difficulté',
        'endettement', 'provisions', 'depreciation', 'dépréciation',
        # Negative events
        'fraude', 'scandale', 'litige', 'amende', 'sanction', 'penalite', 'pénalité',
        'enquete', 'enquête', 'investigation', 'suspension', 'radiation',
        # Market conditions
        'volatilite', 'volatilité', 'incertitude', 'instabilite', 'instabilité',
        'ralentissement', 'recession', 'récession', 'inflation', 'stagnation',
        # Negative actions
        'abandonne', 'annule', 'reporte', 'reduit', 'réduit', 'supprime',
        'licenciement', 'fermeture', 'arret', 'arrêt',
    ]
    
    # Comprehensive Arabic positive financial words
    ARABIC_POSITIVE = [
        # Performance
        'ارتفاع', 'نمو', 'ربح', 'أرباح', 'مكاسب', 'عوائد', 'إيرادات',
        'نجاح', 'تحسن', 'تقدم', 'إنجاز', 'تطور', 'ازدهار',
        # Market terms
        'صعود', 'انتعاش', 'تعافي', 'استقرار', 'ثبات',
        'شراء', 'توصية شراء', 'هدف مرتفع',
        # Financial health
        'سيولة', 'ملاءة', 'قوة', 'صلابة', 'متانة',
        # Growth & expansion
        'توسع', 'استثمار', 'شراكة', 'عقد', 'اتفاق', 'صفقة',
        'تمويل', 'إصدار', 'طرح', 'اكتتاب',
        # Dividends
        'توزيعات', 'أرباح موزعة', 'عائد',
        # Positive actions
        'يرتفع', 'يتحسن', 'يتقدم', 'يحقق', 'ينمو', 'يزيد',
        'إيجابي', 'إيجابية', 'ممتاز', 'متميز', 'رائع',
    ]
    
    # Comprehensive Arabic negative financial words  
    ARABIC_NEGATIVE = [
        # Performance
        'انخفاض', 'خسارة', 'خسائر', 'أزمة', 'تراجع', 'هبوط',
        'سقوط', 'انهيار', 'إفلاس', 'عجز', 'ديون',
        # Market terms
        'بيع', 'توصية بيع', 'هدف منخفض', 'تصحيح',
        # Financial distress
        'تصفية', 'إعادة هيكلة', 'صعوبات', 'مشاكل',
        'مديونية', 'مخصصات', 'إهلاك',
        # Negative events
        'احتيال', 'فضيحة', 'غرامة', 'عقوبة', 'تحقيق',
        'إيقاف', 'تعليق', 'شطب',
        # Market conditions
        'تقلب', 'عدم استقرار', 'ركود', 'تضخم',
        # Negative actions
        'يتراجع', 'ينخفض', 'يهبط', 'يخسر', 'يتدهور',
        'سلبي', 'سلبية', 'ضعيف', 'متدني',
        'تسريح', 'إغلاق', 'توقف',
    ]
    
    # Tunisian stock-specific terms (BVMT context)
    BVMT_TERMS = {
        'positive': [
            'tunindex', 'introduction', 'cote', 'compartiment a',
            'valeur vedette', 'blue chip', 'market maker',
        ],
        'negative': [
            'suspension cotation', 'reservation', 'réservation',
            'radiation', 'delisting', 'avertissement cmf',
        ]
    }
    
    def __init__(self, model_name: str = "nlptown/bert-base-multilingual-uncased-sentiment", load_model: bool = False):
        self.model_name = model_name
        self.pipeline = None
        self._model_loaded = False
        
        if load_model:
            self._load_model()
        
        # Combine all words into sets for faster lookup
        self.positive_words = set(
            self.FRENCH_POSITIVE + 
            self.ARABIC_POSITIVE + 
            self.BVMT_TERMS['positive']
        )
        self.negative_words = set(
            self.FRENCH_NEGATIVE + 
            self.ARABIC_NEGATIVE + 
            self.BVMT_TERMS['negative']
        )
    
    def _load_model(self):
        if self._model_loaded:
            return
        self._model_loaded = True
        try:
            from transformers import pipeline
            self.pipeline = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                truncation=True,
                max_length=512
            )
            print(f"[OK] Loaded sentiment model: {self.model_name}")
        except Exception as e:
            print(f"[WARN] Could not load model: {e}")
            print("   Using rule-based fallback")
            self.pipeline = None
    
    def detect_language(self, text: str) -> str:
        """Detect if text is primarily Arabic or French."""
        if not text:
            return 'fr'
        
        # Count Arabic characters
        arabic_pattern = re.compile(r'[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]')
        arabic_chars = len(arabic_pattern.findall(text))
        total_chars = len(text.replace(' ', ''))
        
        if total_chars == 0:
            return 'fr'
        
        arabic_ratio = arabic_chars / total_chars
        return 'ar' if arabic_ratio > 0.3 else 'fr'
    
    def analyze(self, text: str, language: Optional[str] = None) -> Dict:
        if not text or len(text.strip()) < 10:
            return {'score': 0.0, 'label': 'neutral', 'confidence': 0.0, 'language': language or 'unknown'}
        
        # Auto-detect language if not provided
        if not language:
            language = self.detect_language(text)
        
        text = text[:512]
        
        if self.pipeline:
            try:
                result = self.pipeline(text)[0]
                # nlptown model returns "1 star" to "5 stars"
                stars = int(result['label'][0])
                score = (stars - 3) / 2  # Normalize to -1 to 1
                confidence = result['score']
                
                if score > 0.2:
                    label = 'positive'
                elif score < -0.2:
                    label = 'negative'
                else:
                    label = 'neutral'
                
                return {
                    'score': round(score, 3),
                    'label': label,
                    'confidence': round(confidence, 3),
                    'language': language,
                    'raw_label': result['label']
                }
            except Exception as e:
                print(f"[WARN] Model error: {e}")
        
        return self._rule_based_sentiment(text, language)
    
    def _rule_based_sentiment(self, text: str, language: str = 'fr') -> Dict:
        """Enhanced rule-based sentiment with comprehensive vocabulary."""
        text_lower = text.lower()
        
        # Count matches
        pos_count = 0
        neg_count = 0
        matched_positive = []
        matched_negative = []
        
        for word in self.positive_words:
            if word in text_lower:
                pos_count += 1
                matched_positive.append(word)
        
        for word in self.negative_words:
            if word in text_lower:
                neg_count += 1
                matched_negative.append(word)
        
        total = pos_count + neg_count
        if total == 0:
            return {
                'score': 0.0, 
                'label': 'neutral', 
                'confidence': 0.3,
                'language': language
            }
        
        score = (pos_count - neg_count) / total
        
        # Adjust confidence based on match count
        base_confidence = min(total / 5, 1.0)
        
        if score > 0.2:
            label = 'positive'
        elif score < -0.2:
            label = 'negative'
        else:
            label = 'neutral'
        
        return {
            'score': round(score, 3),
            'label': label,
            'confidence': round(base_confidence, 3),
            'language': language,
            'matched_terms': {
                'positive': matched_positive[:5],
                'negative': matched_negative[:5]
            }
        }
    
    def analyze_article(self, article: Dict) -> Dict:
        """Analyze a news article with title and content."""
        title = article.get('title', '')
        content = article.get('content', article.get('description', ''))
        language = article.get('language', self.detect_language(title + ' ' + content))
        
        # Title has higher weight (1.5x)
        title_result = self.analyze(title, language)
        
        if content and len(content) > 50:
            content_result = self.analyze(content[:1000], language)
            combined_score = (title_result['score'] * 1.5 + content_result['score']) / 2.5
            combined_confidence = (title_result['confidence'] + content_result['confidence']) / 2
        else:
            combined_score = title_result['score']
            combined_confidence = title_result['confidence'] * 0.7
        
        if combined_score > 0.2:
            label = 'positive'
        elif combined_score < -0.2:
            label = 'negative'
        else:
            label = 'neutral'
        
        return {
            'score': round(combined_score, 3),
            'label': label,
            'confidence': round(combined_confidence, 3),
            'language': language,
            'title_sentiment': title_result,
            'url': article.get('url', ''),
            'date': article.get('date', ''),
            'source': article.get('source', ''),
            'stock_code': article.get('stock_code', '')
        }
    
    def analyze_batch(self, articles: List[Dict]) -> List[Dict]:
        """Analyze multiple articles."""
        return [self.analyze_article(article) for article in articles]


class StockSentimentAggregator:
    
    def __init__(self, analyzer: Optional[SentimentAnalyzer] = None):
        self.analyzer = analyzer or SentimentAnalyzer()
    
    def calculate_daily_sentiment(self, stock_code: str, articles: List[Dict]) -> Dict:
        if not articles:
            return {
                'stock': stock_code,
                'date': datetime.now().strftime('%Y-%m-%d'),
                'score': 0.0,
                'label': 'neutral',
                'confidence': 0.0,
                'article_count': 0,
                'articles': []
            }
        
        analyzed = self.analyzer.analyze_batch(articles)
        
        scores = [a['score'] for a in analyzed]
        confidences = [a['confidence'] for a in analyzed]
        
        weights = [0.8 ** i for i in range(len(scores))]
        weighted_score = float(np.average(scores, weights=weights)) if scores else 0.0
        avg_confidence = float(np.mean(confidences)) if confidences else 0.0
        
        article_confidence = min(len(articles) / 5, 1.0)
        final_confidence = (avg_confidence + article_confidence) / 2
        
        if weighted_score > 0.2:
            label = 'positive'
        elif weighted_score < -0.2:
            label = 'negative'
        else:
            label = 'neutral'
        
        return {
            'stock': stock_code,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'score': round(weighted_score, 3),
            'label': label,
            'confidence': round(final_confidence, 3),
            'article_count': len(articles),
            'articles': analyzed[:5]
        }
    
    def get_market_sentiment(self, all_stocks_sentiment: List[Dict]) -> Dict:
        if not all_stocks_sentiment:
            return {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'score': 0.0,
                'label': 'neutral',
                'confidence': 0.0
            }
        
        scores = [s['score'] for s in all_stocks_sentiment if s['article_count'] > 0]
        
        if not scores:
            return {
                'date': datetime.now().strftime('%Y-%m-%d'),
                'score': 0.0,
                'label': 'neutral',
                'confidence': 0.0
            }
        
        avg_score = float(np.mean(scores))
        
        if avg_score > 0.1:
            label = 'bullish'
        elif avg_score < -0.1:
            label = 'bearish'
        else:
            label = 'neutral'
        
        return {
            'date': datetime.now().strftime('%Y-%m-%d'),
            'score': round(avg_score, 3),
            'label': label,
            'confidence': round(len(scores) / len(all_stocks_sentiment), 3),
            'stocks_with_news': len(scores),
            'total_stocks': len(all_stocks_sentiment)
        }


class SentimentService:
    
    def __init__(self, cache_dir: str = 'nlp/data'):
        self.analyzer = SentimentAnalyzer()
        self.aggregator = StockSentimentAggregator(self.analyzer)
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
    
    def get_stock_sentiment(self, stock_code: str, articles: List[Dict]) -> Dict:
        return self.aggregator.calculate_daily_sentiment(stock_code, articles)
    
    def get_market_sentiment(self, stock_sentiments: List[Dict]) -> Dict:
        return self.aggregator.get_market_sentiment(stock_sentiments)
    
    def analyze_single_text(self, text: str, language: Optional[str] = None) -> Dict:
        return self.analyzer.analyze(text, language)
    
    def analyze_article(self, article: Dict) -> Dict:
        return self.analyzer.analyze_article(article)
    
    def analyze_articles(self, articles: List[Dict]) -> List[Dict]:
        return self.analyzer.analyze_batch(articles)
    
    def save_sentiment_cache(self, data: Dict, filename: str = 'sentiment_cache.json'):
        cache_path = self.cache_dir / filename
        data['timestamp'] = datetime.now().isoformat()
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def load_sentiment_cache(self, filename: str = 'sentiment_cache.json') -> Optional[Dict]:
        cache_path = self.cache_dir / filename
        if cache_path.exists():
            with open(cache_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None


if __name__ == '__main__':
    print("Testing Sentiment Analyzer...")
    print("=" * 50)
    
    analyzer = SentimentAnalyzer()
    
    french_tests = [
        "SFBT annonce une hausse de 15% de son benefice annuel",
        "La banque BIAT en difficulte face a la crise economique",
        "Le marche tunisien reste stable cette semaine",
        "Resultats exceptionnels pour SAH avec des profits records",
        "Chute des actions de Carthage Cement suite aux pertes",
    ]
    
    arabic_tests = [
        "بورصة تونس تسجل ارتفاعا ملحوظا في المؤشر العام",
        "خسائر كبيرة للشركات الصناعية في الربع الاخير",
        "نمو قوي في ارباح البنوك التونسية",
        "تراجع حاد في اسعار الاسهم بسبب الازمة",
        "توزيعات ارباح قياسية لشركة صوتوشيم",
    ]
    
    print("\n[French News Sentiment]")
    print("-" * 50)
    for text in french_tests:
        result = analyzer.analyze(text)
        icon = "[+]" if result['label'] == 'positive' else "[-]" if result['label'] == 'negative' else "[=]"
        print(f"{icon} {result['label'].upper():8} (score: {result['score']:+.2f}) | {text[:50]}...")
    
    print("\n[Arabic News Sentiment]")
    print("-" * 50)
    for text in arabic_tests:
        result = analyzer.analyze(text)
        icon = "[+]" if result['label'] == 'positive' else "[-]" if result['label'] == 'negative' else "[=]"
        print(f"{icon} {result['label'].upper():8} (score: {result['score']:+.2f}) | {text[:50]}...")
    
    print("\n" + "=" * 50)
    print("Sentiment Analyzer test complete!")