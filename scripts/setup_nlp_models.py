"""
Setup script for NLP models required for resume parsing
"""
import subprocess
import sys
import nltk

def setup_nlp_models():
    """Download and setup required NLP models"""
    print("Setting up NLP models for resume parsing...")
    
    # Download NLTK data
    print("Downloading NLTK data...")
    nltk.download('punkt')
    nltk.download('stopwords')
    nltk.download('averaged_perceptron_tagger')
    nltk.download('maxent_ne_chunker')
    nltk.download('words')
    
    # Download spaCy model
    print("Downloading spaCy model...")
    try:
        import spacy
        spacy.cli.download("en_core_web_sm")
        print("spaCy model downloaded successfully.")
    except Exception as e:
        print(f"Error downloading spaCy model: {e}")
        print("You may need to run: python -m spacy download en_core_web_sm")
    
    # Create necessary directories
    import os
    os.makedirs("uploads/parsed_resumes", exist_ok=True)
    os.makedirs("uploads/candidate_documents", exist_ok=True)
    
    print("\nNLP setup complete!")
    print("\nTo test resume parsing, upload a PDF/DOCX resume through the candidate portal.")
    print("The system will automatically extract:")
    print("  - Name, Email, Phone")
    print("  - Skills and Experience")
    print("  - Education and Companies")
    print("  - And auto-fill job applications")

if __name__ == "__main__":
    setup_nlp_models()