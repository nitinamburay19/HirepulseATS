"""
Helper functions for the application
"""
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, List
import json

def generate_unique_code(prefix: str = "CODE") -> str:
    """
    Generate a unique code with prefix
    """
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def calculate_variance(actual: float, expected: float) -> float:
    """
    Calculate percentage variance
    """
    if expected == 0:
        return 0
    return ((actual - expected) / expected) * 100

def format_date_for_display(date_obj: datetime) -> str:
    """
    Format datetime for display
    """
    if not date_obj:
        return ""
    return date_obj.strftime("%Y-%m-%d %H:%M")

def safe_json_loads(json_str: str) -> Dict[str, Any]:
    """
    Safely load JSON string
    """
    try:
        return json.loads(json_str)
    except:
        return {}

def paginate_list(data_list: List[Any], page: int = 1, page_size: int = 10) -> Dict[str, Any]:
    """
    Paginate a list
    """
    total = len(data_list)
    start = (page - 1) * page_size
    end = start + page_size
    
    return {
        "items": data_list[start:end],
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": (total + page_size - 1) // page_size
    }