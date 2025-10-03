# Lakbai-Colab: BERT-based Tourism Recommendation System

This project implements a BERT-based recommendation system for tourism using Point of Interest (POI) data and user visit patterns.

## Project Overview

The system uses transformer models (BERT, RoBERTa, ALBERT, etc.) to predict tourist preferences and recommend travel itineraries based on:
- Historical user visit data
- POI characteristics and themes
- Geographic information
- Time constraints

## Environment Details

The project uses a Python virtual environment with the following key packages:
- **pandas** - Data manipulation and analysis
- **numpy** - Numerical computing
- **torch** - PyTorch deep learning framework
- **simpletransformers** - Easy-to-use transformer models
- **scikit-learn** - Machine learning tools
- **scipy** - Scientific computing
- **transformers** - Hugging Face transformers library

## Usage

### Basic Usage

Run the main script with default parameters:
```bash
python BTRec_RecTour23.py --city Legazpi --epochs 1 --model bert
```

### Advanced Usage

```bash
python BTRec_RecTour23.py --city [CITY] --epochs [NUM] --model [MODEL] [--cuda]
```

**Parameters:**
- `--city` or `-c`: City name (required) - e.g., "Legazpi"
- `--epochs` or `-e`: Number of training epochs (required)
- `--model` or `-m`: Model type (optional, default: "bert")
  - Options: bert, roberta, albert, xlnet, distilbert
- `--cuda`: Enable CUDA GPU acceleration (optional)

**Example:**
```bash
python BTRec_RecTour23.py --city Legazpi --epochs 5 --model roberta --cuda
```

## Data Files

The project expects the following data files in the `Data/` directory:
- `POI-Legazpi.csv` - Point of Interest data for Legazpi
- `user_hometown.csv` - User demographic information
- `userVisits-Legazpi-allPOI.csv` - User visit history data

## Output

The system generates:
- Trained model files in `output_[city]_e[epochs]_[model]/`
- Training logs and metrics
- F1 scores for evaluation and testing
- Predicted tourist itineraries

## Project Structure

```
lakbai-colab/
├── BTRec_RecTour23.py      # Main script
├── config.py               # Configuration settings
├── common.py               # Utility functions
├── poidata.py             # POI data handling
├── Bootstrap.py           # Bootstrap utilities
├── Data/                  # Data directory
├── .venv/                 # Virtual environment
├── requirements.txt       # Python dependencies
├── activate_env.bat       # Environment activation script
└── README.md             # This file
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Make sure the virtual environment is activated
2. **CUDA Issues**: If you don't have a GPU, remove the `--cuda` flag
3. **Memory Issues**: Reduce the number of epochs or use a smaller model
4. **Data Issues**: Ensure data files are in the correct `Data/` directory


## License

This project is for educational and research purposes.

## Support

For issues or questions, please check:
1. The data format in the `Data/` directory