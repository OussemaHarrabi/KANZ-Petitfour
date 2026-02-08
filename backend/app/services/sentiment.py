"""Sentiment analysis wrapper service."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

import numpy as np


class SentimentService:
    def __init__(self):
        self._nlp_analyzer = None
        self._nlp_loaded = False
        
        self.positive_words_fr = {
            "hausse", "augmentation", "croissance", "profit", "benefice", "bénéfice",
            "succes", "succès", "progression", "amelioration", "amélioration", "record",
            "gain", "optimiste", "performance", "dividende", "expansion", "favorable",
        }
        self.negative_words_fr = {
            "baisse", "chute", "perte", "deficit", "déficit", "crise", "recul",
            "degradation", "dégradation", "effondrement", "risque", "difficile",
            "pessimiste", "dette", "faillite", "inquietude", "inquiétude",
        }
        self.positive_words_ar = {
            "ارتفاع", "نمو", "ربح", "أرباح", "مكاسب", "نجاح", "تحسن", "تقدم",
            "صعود", "انتعاش", "استقرار", "توزيعات", "إيجابي",
        }
        self.negative_words_ar = {
            "انخفاض", "خسارة", "خسائر", "أزمة", "تراجع", "هبوط", "انهيار",
            "إفلاس", "عجز", "ديون", "سلبي", "ضعيف",
        }
    
    def _init_nlp(self):
        if self._nlp_loaded:
            return
        self._nlp_loaded = True
        try:
            import sys
            import os
            nlp_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "nlp")
            sys.path.insert(0, nlp_path)
            from sentiment.analyzer import SentimentAnalyzer
            self._nlp_analyzer = SentimentAnalyzer()
        except Exception:
            self._nlp_analyzer = None

    def analyze_text(self, text: str, language: Optional[str] = None) -> Dict:
        if not text:
            return {"score": 0.0, "label": "neutral", "confidence": 0.0}
        
        if self._nlp_analyzer:
            try:
                return self._nlp_analyzer.analyze(text, language)
            except Exception:
                pass
        
        return self._rule_based_analyze(text)
    
    def _rule_based_analyze(self, text: str) -> Dict:
        lower = text.lower()
        
        pos = sum(1 for w in self.positive_words_fr if w in lower)
        pos += sum(1 for w in self.positive_words_ar if w in text)
        neg = sum(1 for w in self.negative_words_fr if w in lower)
        neg += sum(1 for w in self.negative_words_ar if w in text)
        
        total = pos + neg
        if total == 0:
            return {"score": 0.0, "label": "neutral", "confidence": 0.2}
        
        score = (pos - neg) / total
        label = "neutral"
        if score > 0.2:
            label = "positive"
        elif score < -0.2:
            label = "negative"
        
        return {
            "score": round(score, 3),
            "label": label,
            "confidence": round(min(total / 5, 1.0), 3),
        }
    
    def analyze_article(self, article: Dict) -> Dict:
        title = article.get("title", "")
        content = article.get("content", article.get("description", ""))
        language = article.get("language")
        
        if self._nlp_analyzer:
            try:
                return self._nlp_analyzer.analyze_article(article)
            except Exception:
                pass
        
        title_result = self.analyze_text(title, language)
        
        if content and len(content) > 50:
            content_result = self.analyze_text(content[:1000], language)
            combined_score = (title_result["score"] * 1.5 + content_result["score"]) / 2.5
            combined_confidence = (title_result["confidence"] + content_result["confidence"]) / 2
        else:
            combined_score = title_result["score"]
            combined_confidence = title_result["confidence"] * 0.7
        
        label = "neutral"
        if combined_score > 0.2:
            label = "positive"
        elif combined_score < -0.2:
            label = "negative"
        
        return {
            "score": round(combined_score, 3),
            "label": label,
            "confidence": round(combined_confidence, 3),
            "url": article.get("url", ""),
            "date": article.get("date", ""),
        }

    def stock_sentiment(self, stock_code: str, news: List[Dict]) -> Dict:
        if not news:
            return {
                "stock": stock_code,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "score": 0.0,
                "label": "neutral",
                "confidence": 0.0,
                "article_count": 0,
                "articles": [],
            }
        
        analyzed = [self.analyze_article(item) for item in news]
        scores = [a["score"] for a in analyzed]
        
        weights = [0.8 ** i for i in range(len(scores))]
        weighted_score = float(np.average(scores, weights=weights)) if scores else 0.0
        
        label = "neutral"
        if weighted_score > 0.2:
            label = "positive"
        elif weighted_score < -0.2:
            label = "negative"
        
        return {
            "stock": stock_code,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "score": round(weighted_score, 3),
            "label": label,
            "confidence": min(len(news) / 5, 1.0),
            "article_count": len(news),
            "articles": analyzed[:5],
        }

    def market_sentiment(self, sentiments: List[Dict]) -> Dict:
        if not sentiments:
            return {
                "date": datetime.now().strftime("%Y-%m-%d"),
                "score": 0.0,
                "label": "neutral",
                "confidence": 0.0,
            }
        scores = [s["score"] for s in sentiments if s.get("article_count", 0) > 0]
        avg_score = float(np.mean(scores)) if scores else 0.0
        label = "neutral"
        if avg_score > 0.1:
            label = "bullish"
        elif avg_score < -0.1:
            label = "bearish"
        return {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "score": round(avg_score, 3),
            "label": label,
            "confidence": round(len(scores) / len(sentiments), 3) if sentiments else 0.0,
        }
