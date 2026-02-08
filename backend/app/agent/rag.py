"""Simple in-memory RAG for CMF regulations."""

from __future__ import annotations

import json
import math
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List


@dataclass
class CMFDocument:
    doc_id: str
    title: str
    title_ar: str
    content: str
    content_ar: str
    category: str
    penalty: str


CMF_REGULATIONS: List[CMFDocument] = []


def _load_regulations():
    global CMF_REGULATIONS
    if CMF_REGULATIONS:
        return
    
    json_path = Path(__file__).parent / "cmf_regulations.json"
    if json_path.exists():
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            for reg in data.get("cmf_regulations", []):
                CMF_REGULATIONS.append(CMFDocument(
                    doc_id=reg["id"],
                    title=reg["title"],
                    title_ar=reg.get("title_ar", ""),
                    content=reg["content"],
                    content_ar=reg.get("content_ar", ""),
                    category=reg.get("category", ""),
                    penalty=reg.get("penalty", ""),
                ))
    
    if not CMF_REGULATIONS:
        CMF_REGULATIONS.extend([
            CMFDocument(
                doc_id="cmf-01",
                title="Regles de transparence et information du marche",
                title_ar="قواعد الشفافية والإعلام",
                content="Les societes cotees doivent publier des informations exactes et completes.",
                content_ar="يجب على الشركات المدرجة نشر معلومات دقيقة وكاملة.",
                category="transparency",
                penalty="Amende",
            ),
            CMFDocument(
                doc_id="cmf-02",
                title="Abus de marche et manipulation",
                title_ar="إساءة استخدام السوق والتلاعب",
                content="Toute manipulation de cours ou diffusion de fausses informations est interdite.",
                content_ar="يحظر أي تلاعب بالأسعار أو نشر معلومات كاذبة.",
                category="market_manipulation",
                penalty="Emprisonnement et amende",
            ),
            CMFDocument(
                doc_id="cmf-03",
                title="Delits d'initie",
                title_ar="التداول بناء على معلومات داخلية",
                content="L'utilisation d'informations privilegiees pour des transactions est interdite.",
                content_ar="يحظر استخدام المعلومات المميزة لإجراء المعاملات.",
                category="insider_trading",
                penalty="Emprisonnement de 1 a 5 ans",
            ),
        ])


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[\w']+", text.lower())


def _tf(tokens: Iterable[str]) -> dict:
    tf = {}
    for token in tokens:
        tf[token] = tf.get(token, 0) + 1
    return tf


def _cosine_similarity(a: dict, b: dict) -> float:
    if not a or not b:
        return 0.0
    common = set(a).intersection(b)
    numerator = sum(a[t] * b[t] for t in common)
    denom_a = math.sqrt(sum(v * v for v in a.values()))
    denom_b = math.sqrt(sum(v * v for v in b.values()))
    if denom_a == 0 or denom_b == 0:
        return 0.0
    return numerator / (denom_a * denom_b)


def search_cmf(query: str, top_k: int = 3) -> List[CMFDocument]:
    _load_regulations()
    query_tf = _tf(_tokenize(query))
    scored = []
    for doc in CMF_REGULATIONS:
        doc_text = f"{doc.title} {doc.title_ar} {doc.content} {doc.content_ar} {doc.category}"
        doc_tf = _tf(_tokenize(doc_text))
        score = _cosine_similarity(query_tf, doc_tf)
        scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [doc for score, doc in scored[:top_k] if score > 0]


def format_cmf_context(query: str, top_k: int = 3, lang: str = "fr") -> str:
    docs = search_cmf(query, top_k=top_k)
    if not docs:
        return ""
    sections = ["CMF regulation excerpts:"]
    for doc in docs:
        if lang == "ar":
            sections.append(f"- {doc.title_ar}: {doc.content_ar}")
        else:
            sections.append(f"- {doc.title}: {doc.content}")
        if doc.penalty:
            sections.append(f"  Sanction: {doc.penalty}")
    return "\n".join(sections)
