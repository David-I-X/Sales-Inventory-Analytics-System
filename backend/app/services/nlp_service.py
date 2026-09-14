from typing import Tuple

class NLPService:
    """
    Lazy-loading NLP service. The sentence-transformers model is only loaded
    the first time classify_intent is called, not at server startup.
    """
    def __init__(self):
        self.model_name = "paraphrase-multilingual-MiniLM-L12-v2"
        self._model = None
        self._ready = False
        
        self.intents = {
            "invoice_request": [
                "necesito una factura", "quiero facturar esto", "me das la factura", 
                "cómo descargo mi factura", "facturación", "facturar servicio"
            ],
            "sales_inquiry": [
                "cuánto cuesta", "tienen disponibilidad", "quiero comprar", "precio", "cotización", "información de servicio"
            ],
            "support": [
                "tengo un problema", "no funciona", "ayuda", "soporte técnico", "está roto", "me falla la alarma", "GPS desconectado"
            ]
        }
        
        self.intent_embeddings = {}

    def _ensure_loaded(self):
        if self._ready:
            return
        # Import heavy libraries only when needed
        from sentence_transformers import SentenceTransformer
        self._model = SentenceTransformer(self.model_name)
        
        for intent, phrases in self.intents.items():
            self.intent_embeddings[intent] = self._model.encode(phrases)
        
        self._ready = True

    def classify_intent(self, text: str) -> Tuple[str, float]:
        text_lower = text.lower()
        
        # Fast rule-based keyword matching (instant sub-ms response)
        if any(w in text_lower for w in ["factura", "facturar", "cufe", "cobro"]):
            return "invoice_request", 0.95
        if any(w in text_lower for w in ["precio", "cuesta", "cotización", "cotizacion", "comprar", "costo"]):
            return "sales_inquiry", 0.92
        if any(w in text_lower for w in ["problema", "ayuda", "soporte", "fallo", "desconectado", "roto"]):
            return "support", 0.88

        # Fallback to SentenceTransformer embeddings for complex sentences
        try:
            self._ensure_loaded()
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np
            
            text_emb = self._model.encode([text])
            best_intent = "unknown"
            best_score = 0.0
            
            for intent, ref_embs in self.intent_embeddings.items():
                scores = cosine_similarity(text_emb, ref_embs)[0]
                max_score = float(np.max(scores))
                if max_score > best_score:
                    best_score = max_score
                    best_intent = intent
                    
            if best_score < 0.4:
                return "unknown", best_score
                
            return best_intent, best_score
        except Exception:
            return "unknown", 0.0

# Singleton
nlp_service = NLPService()
