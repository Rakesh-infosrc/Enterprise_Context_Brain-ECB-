"""
Enterprise Context Brain (ECB) v2.1 - Hybrid Retrieval & Conflict Engine
Implements TRS-RET-02 & DATA-EVID-01:
Combines lexical scoring, semantic similarity, authority weighting,
temporal freshness scoring, and surfaces source contradictions.
"""

from datetime import datetime
import re
from typing import List, Tuple, Dict, Any, Optional
from ...domain.schemas import (
    Evidence,
    ContextPlan,
    SourceType,
    AuthorityLevel,
)
from ...infrastructure.db.store import CanonicalStore


class HybridRetriever:
    def __init__(self, store: Optional[CanonicalStore] = None):
        self.store = store or CanonicalStore.get_instance()

    def _calculate_lexical_score(self, query: str, evidence: Evidence) -> float:
        """Calculates token overlap and exact keyword matching."""
        q_tokens = set(re.findall(r"\w+", query.lower()))
        if not q_tokens:
            return 0.5
        
        target_text = f"{evidence.source_title} {evidence.external_id} {evidence.excerpt} {evidence.author or ''}".lower()
        target_tokens = set(re.findall(r"\w+", target_text))
        
        overlap = len(q_tokens.intersection(target_tokens))
        base_score = overlap / len(q_tokens)
        
        # Boost for explicit ID match (e.g. "AEGIS-108", "ADR-002")
        if evidence.external_id.lower() in query.lower():
            base_score += 0.4
        
        return min(1.0, base_score)

    def _calculate_authority_weight(self, authority: AuthorityLevel) -> float:
        weights = {
            AuthorityLevel.HIGH: 1.0,
            AuthorityLevel.MEDIUM: 0.8,
            AuthorityLevel.LOW: 0.5,
        }
        return weights.get(authority, 0.7)

    def retrieve(
        self,
        context_plan: ContextPlan,
        top_k: int = 10,
    ) -> Tuple[List[Evidence], List[Evidence], List[Evidence]]:
        """
        Executes hybrid retrieval and splits candidates into:
        (supporting_evidence, conflicting_evidence, superseded_evidence)
        """
        all_evidence = self.store.get_evidence_list()
        
        # 1. Scope Filtering by Project & Source Types
        candidates = []
        for ev in all_evidence:
            if context_plan.project_ids and ev.project_id not in context_plan.project_ids:
                continue
            if context_plan.required_evidence_types and ev.source_type not in context_plan.required_evidence_types:
                continue
            candidates.append(ev)

        # 2. Score candidates: Lexical (40%) + Semantic/Relevance (35%) + Freshness (15%) + Authority (10%)
        scored_candidates = []
        for ev in candidates:
            lex_score = self._calculate_lexical_score(context_plan.query, ev)
            auth_weight = self._calculate_authority_weight(ev.authority)
            
            combined_score = (
                (lex_score * 0.40) +
                (ev.relevance_score * 0.35) +
                (ev.freshness_score * 0.15) +
                (auth_weight * 0.10)
            )
            
            # Boost if query explicitly mentions entities
            for ent in context_plan.target_entities:
                if ent.lower() in ev.excerpt.lower() or ent.lower() in ev.source_title.lower():
                    combined_score += 0.15
            
            scored_candidates.append((combined_score, ev))

        # Sort by combined score descending
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        top_candidates = [ev for _, ev in scored_candidates[:top_k]]

        # 3. Categorize into Supporting, Conflicting, and Superseded
        supporting = []
        conflicting = []
        superseded = []

        for ev in top_candidates:
            if ev.is_superseded:
                superseded.append(ev)
            elif ev.is_conflicting:
                conflicting.append(ev)
            else:
                supporting.append(ev)

        # Ensure at least relevant items are surfaced
        if not supporting and not conflicting and not superseded and top_candidates:
            supporting = top_candidates[:5]

        return supporting, conflicting, superseded
