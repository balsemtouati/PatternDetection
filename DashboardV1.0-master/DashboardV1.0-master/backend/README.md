# Pattern Analysis Backend

A modular Python Flask backend for advanced pattern detection and analysis using GPGrowth-inspired algorithms.

## 🏗️ Architecture

The backend is built with a modular architecture for maintainability and scalability:

```
backend/
├── app.py                 # Main Flask application
├── config.py             # Configuration and constants
├── data_processor.py     # Data processing and validation
├── pattern_miner.py      # GPGrowth pattern mining algorithms
├── pattern_analyzer.py   # Pattern analysis orchestrator
├── api_routes.py         # API endpoint handlers
├── test_backend.py       # Test suite
├── requirements.txt      # Python dependencies
├── run.py               # Launch script
└── README.md            # This file
```

## 📦 Modules

### 1. **config.py** - Configuration Management
- Centralized configuration for all settings
- Data type mappings and column configurations
- Pattern analysis parameters
- Scoring weights and complexity scores

### 2. **data_processor.py** - Data Processing
- File upload handling and validation
- Data type detection based on filenames
- Data preprocessing and cleaning
- Missing value handling and type conversion
- Derived column generation

### 3. **pattern_miner.py** - Pattern Mining Engine
- **GPGrowthPatternMiner**: Advanced pattern mining using GPGrowth-inspired algorithms
- **PatternRefiner**: Converts raw patterns into business-ready insights
- Support, confidence, and lift calculations
- Transaction extraction and preprocessing

### 4. **pattern_analyzer.py** - Analysis Orchestrator
- Coordinates pattern mining across multiple datasets
- Handles data source management
- Calculates analysis statistics
- Provides analysis summaries

### 5. **api_routes.py** - API Endpoints
- File upload endpoint (`/api/upload`)
- Pattern analysis endpoint (`/api/analyze`)
- Health check endpoint (`/api/health`)
- Status endpoint (`/api/status`)

### 6. **app.py** - Main Application
- Flask application setup
- CORS configuration
- Route registration
- Application startup

## 🚀 Getting Started

### Installation

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run tests:**
   ```bash
   python test_backend.py
   ```

3. **Start the server:**
   ```bash
   python app.py
   ```

### API Endpoints

- **GET /** - API information
- **POST /api/upload** - Upload CSV/JSON/Excel files
- **POST /api/analyze** - Analyze patterns in uploaded data
- **GET /api/health** - Health check
- **GET /api/status** - Detailed system status

## 🔧 Configuration

Key configuration options in `config.py`:

```python
# Pattern Mining
DEFAULT_MIN_SUPPORT = 0.1      # Minimum support threshold
DEFAULT_MIN_CONFIDENCE = 0.6   # Minimum confidence threshold
DEFAULT_MAX_PATTERNS = 8       # Maximum patterns to return

# Data Types
DATA_TYPE_MAPPING = {
    'crm': ['crm', 'sales', 'deals'],
    'financial': ['financial', 'finance', 'revenue'],
    'hr': ['hr', 'employee', 'personnel'],
    # ...
}
```

## 📊 Pattern Types

The system detects and classifies patterns into:

1. **Certification Paradox** - Team composition insights
2. **Temporal Trap** - Time-based patterns
3. **Amplification Effect** - Exponential improvement patterns
4. **Hierarchy Pattern** - Channel and method hierarchies
5. **Optimization Opportunity** - Efficiency improvement patterns

## 🧪 Testing

Run the comprehensive test suite:

```bash
python test_backend.py
```

Tests cover:
- Data processing functionality
- Pattern mining algorithms
- Pattern refinement
- Full analysis pipeline

## 📈 Pattern Output Format

Each detected pattern includes:

```json
{
  "id": "unique-pattern-id",
  "title": "Pattern Title",
  "impact": "45.2% improvement potential",
  "confidence": "87.3% statistical confidence",
  "complexity": "High",
  "description": "Detailed pattern description...",
  "variables": ["var1", "var2", "var3"],
  "businessValue": [
    "Value proposition 1",
    "Value proposition 2"
  ],
  "implementation": [
    "Phase 1: Implementation step",
    "Phase 2: Implementation step"
  ],
  "metrics": [
    "Metric 1",
    "Metric 2"
  ],
  "scores": {
    "support": 0.25,
    "confidence": 0.87,
    "lift": 2.3,
    "conviction": 1.8,
    "impact": 45.2,
    "complexity": 0.8,
    "overallScore": 0.75
  }
}
```

## 🔄 Data Flow

1. **Upload** → Files are uploaded and processed
2. **Validation** → Data quality and structure validation
3. **Preprocessing** → Data cleaning and transformation
4. **Mining** → GPGrowth pattern mining
5. **Refinement** → Raw patterns converted to business insights
6. **Analysis** → Statistics and metadata calculation
7. **Response** → Structured pattern data returned

## 🛠️ Development

### Adding New Pattern Types

1. Update `PATTERN_TYPES` in `config.py`
2. Add classification logic in `PatternRefiner._classify_pattern_type()`
3. Add description templates in `PatternRefiner._generate_description()`

### Adding New Data Types

1. Update `DATA_TYPE_MAPPING` in `config.py`
2. Add column mappings in `COLUMN_MAPPINGS`
3. Update preprocessing logic in `DataProcessor`

### Extending Pattern Mining

1. Modify `GPGrowthPatternMiner` for new algorithms
2. Update `PatternRefiner` for new pattern formats
3. Add tests in `test_backend.py`

## 📝 Logging

The application uses structured logging:

```python
import logging
logger = logging.getLogger(__name__)
logger.info("Processing file: %s", filename)
```

## 🔒 Security

- File upload validation
- Secure filename handling
- Input sanitization
- Error handling without information leakage

## 📊 Performance

- Efficient pattern mining algorithms
- Optimized data processing
- Configurable batch sizes
- Memory-efficient transaction handling

## 🤝 Contributing

1. Follow the modular architecture
2. Add tests for new functionality
3. Update documentation
4. Use consistent naming conventions
5. Handle errors gracefully 