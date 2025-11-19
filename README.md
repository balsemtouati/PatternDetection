# Pattern Internship — Plateforme d'analyse de patterns (GraphRAG & MURAG)

## Description

Ce dépôt contient une plateforme d'analyse de patterns et d'intelligence concurrentielle développée dans le cadre du projet Pattern Internship. La plateforme combine :

- GraphRAG : analyse sémantique et raisonnement sur un knowledge graph (graphes JSON contenant nœuds et arêtes).
- MURAG : pipeline de veille concurrentielle multi‑documents (ingestion PDF, extraction, indexation, recherche sémantique, synthèse stratégique).

L'objectif est d'automatiser la recherche d'insights stratégiques à partir de graphes de connaissances et de rapports PDF concurrents, puis d'exposer ces résultats via une API REST et une interface web.

---

## Fonctionnalités principales

- Ingestion et parsing automatique de rapports PDF concurrents (extraction texte, chunking).
- Indexation vectorielle des passages (embeddings) et recherche rapide grâce à FAISS.
- MURAG : pipeline complet pour l'analyse concurrentielle, extraction de patterns et génération de recommandations (LLM-driven).
- GraphRAG : exploration de graphes, expansion de voisinage, résumé de sous-graphes et réponses contextuelles via LLM.
- API REST (Flask) exposant les endpoints d'analyse et de chat concurrentiel.
- Frontend React + Vite pour visualiser les résultats et interagir avec la plateforme.

---

## Architecture (résumé)

- Backend (Python 3.11) : services/modules organisés autour de fonctionnalités clés : `api_routes*.py` (endpoints), `working_graphrag.py` / `notebook_graphrag_analyzer.py` (GraphRAG), `MURAG.py` / `MURAG_simple.py` (veille concurrencielle).
- Recherche vectorielle : FAISS.
- Embeddings & génération : Google Gemini (via LangChain) et/ou TogetherAI (dans MURAG.py).
- Frontend : React + TypeScript + Vite + Tailwind CSS.
- Données : fichiers JSON pour le graphe (`graphRAG/case_studies_graph.json`) et dossiers de PDF (`Data_pdfs/pdfs` ou `pdfs` suivant le module).

---

## Prérequis

- Windows / Linux / macOS
- Python 3.11
- Node.js (14+ recommandé) et npm
- Virtualenv (ou venv intégré)

---

## Installation & configuration (Backend)

Ouvrez un terminal PowerShell et placez‑vous à la racine du projet :


Créer et activer l'environnement virtuel (Windows PowerShell) :

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Mettre à jour pip et setuptools (dans l'environnement activé) :

```powershell
python -m pip install --upgrade pip setuptools
```

Installer les dépendances du backend :

```powershell
pip install -r DashboardV1.0-master\DashboardV1.0-master\backend\requirements.txt
```

---

## Variables d'environnement importantes

- `GOOGLE_API_KEY` : clé pour Google Generative AI (Gemini) — utilisée par GraphRAG / LangChain.
- `TOGETHER_API_KEY` : clé pour Together AI (utilisée dans `MURAG.py` par défaut si présente).

Exemple (PowerShell temporaire pour la session actuelle) :

```powershell
$env:GOOGLE_API_KEY = "YOUR_GOOGLE_API_KEY"
$env:TOGETHER_API_KEY = "YOUR_TOGETHER_API_KEY"
```

> Important : assurez‑vous que la clé Google a du quota si vous utilisez Gemini pour l'embedding/génération — sinon la construction des embeddings échouera (erreur 429 quota exceeded).

---

## Lancer le backend

Depuis la racine du projet (avec `.venv` activé) :

```powershell
python DashboardV1.0-master\DashboardV1.0-master\backend\run.py
```

Par défaut, l'API écoute sur `http://127.0.0.1:5000`.

Endpoints utiles :

- `GET /api/health` : état du backend et services.
- `POST /api/competitor-chat` : chat / veille concurrentielle (MURAG).
- `POST /api/analyze-graphrag` : analyse GraphRAG (question sur le graphe).

Consultez `DashboardV1.0-master/DashboardV1.0-master/backend/api_routes_nopandas.py` pour les détails d'implémentation et du format de réponse.

---

## Installer & lancer le frontend

```powershell
cd DashboardV1.0-master\DashboardV1.0-master
npm install
npm run dev
```

Le frontend Vite s'ouvre généralement sur `http://localhost:5173`.

> Vérifiez la configuration du frontend (`src/config` ou les fichiers `.env`) si vous devez pointer vers une URL backend différente.

---

## Détails techniques — MURAG (veille concurrentielle)

- `MURAG.py` implémente un PDFCopilot qui :
  - Scanne un dossier `pdfs/` et extrait le texte avec PyMuPDF / PyPDF2.
  - Segmente le texte en "chunks" et calcule des embeddings (SentenceTransformers dans l'implémentation locale, ou Gemini selon la configuration).
  - Indexe les vecteurs avec FAISS.
  - Recherche des passages pertinents pour une question donnée.
  - Utilise un LLM en tant que "judge" (`_judge_retrieved_data`) pour filtrer les passages réellement pertinents avant synthèse.
  - Extrait des patterns récurrents et génère des recommandations stratégiques via des appels LLM (TogetherAI dans le fichier fourni).

- Avantage clé : MURAG ajoute la traçabilité document→entreprise, agrégation multi‑entreprise et sorties JSON prêtes pour reporting.

---

## Détails techniques — GraphRAG

- Fichiers principaux : `working_graphrag.py`, `notebook_graphrag_analyzer.py`, `graphrag_wrapper.py`.
- Workflow : charger graph JSON → convertir nœuds/arêtes en texte → embeddings → index FAISS → retrieval → expansion de voisinage → résumé → génération via LLM.

---

## Exemples d'appels API

### Competitor chat (MURAG)

```http
POST http://localhost:5000/api/competitor-chat
Content-Type: application/json

{ "query": "Quels sont les points forts de Capgemini sur le cloud ?" }
```

Extrait de réponse attendu (JSON) :

```json
{
  "success": true,
  "answer": "Capgemini se distingue par...",
  "documents_count": 12,
  "companies_analyzed": ["Capgemini", "Accenture"]
}
```

### GraphRAG analysis

```http
POST http://localhost:5000/api/analyze-graphrag
Content-Type: application/json

{ "query": "Quelles stratégies d'outsourcing apparaissent pour les entreprises du secteur X ?" }
```

La réponse contient `patterns`, `analysisMetadata` (retrievedDocs, seedCount, subgraphNodes, subgraphEdges), et un sous-graphe limité.

---

## Dépannage (problèmes connus)

- **Erreur 429 / quota dépassé lors de la génération d'embeddings** :
  - Message type : `ResourceExhausted: 429 You exceeded your current quota`.
  - Cause : clé Google (Gemini) sans quota ou facturation non activée.
  - Solution : utiliser une autre clé liée à un projet GCP avec quota, activer la facturation, ou modifier le code pour utiliser un autre fournisseur d'embeddings (ex : OpenAI, SentenceTransformers local).

- **Incompatibilités Python** :
  - Le projet fonctionne avec Python 3.11 (certaines dépendances ne supportent pas Python 3.13+).
  - Assurez-vous d'utiliser `py -3.11 -m venv .venv` sur Windows.

- **Problèmes d'index FAISS** :
  - Si `faiss` n'est pas disponible en binaire pour votre plateforme, installez la version adaptée ou utilisez `pip install faiss-cpu` si compatible.

---

## Contribuer

Contributions bienvenues : améliorer parsing PDF (OCR), ajouter tests unitaires, adapter l'intégration d'LLM, optimiser la mémoire de FAISS, ajouter UI/UX.

1. Fork the repo
2. Create a branch `feature/xxx`
3. Submit a PR with description and tests

---

## Licence

Choisissez la licence appropriée (MIT, Apache-2.0, etc.). Par défaut, ajoutez un fichier `LICENSE` si vous voulez publier sur GitHub.

---

## Crédits

Ce projet combine des approches RAG, FAISS et LLM pour produire une plateforme de veille concurrentielle et d'analyse de patterns basée sur le graphe. Certains fichiers/fonctions s'appuient sur bibliothèques open-source (LangChain, SentenceTransformers, FAISS, PyMuPDF).

---

## Contact

Pour toute question ou contribution : ajoutez une issue sur GitHub ou contactez l'équipe projet.
