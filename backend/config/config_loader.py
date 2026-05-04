"""
Sanjeevani v2 — YAML Config Loader
Loads clinical_rules.yaml and amr_rules.yaml with caching and hot-reload.
"""

import yaml
import os
from functools import lru_cache
from pathlib import Path

CONFIG_DIR = Path(__file__).parent


def _load_yaml(filename: str) -> dict:
    """Load a YAML file from the config directory."""
    filepath = CONFIG_DIR / filename
    with open(filepath, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


@lru_cache()
def get_clinical_rules() -> dict:
    """Load and cache clinical_rules.yaml."""
    return _load_yaml("clinical_rules.yaml")


@lru_cache()
def get_amr_rules() -> dict:
    """Load and cache amr_rules.yaml."""
    return _load_yaml("amr_rules.yaml")


def get_rule_version() -> str:
    """Get the current clinical rule version string for audit trail."""
    return get_clinical_rules().get("rule_version", "unknown")


def get_amr_version() -> str:
    """Get the current AMR rule version string."""
    return get_amr_rules().get("amr_version", "unknown")


def reload_configs():
    """Clear cache and reload all configs. Call when YAML files are updated."""
    get_clinical_rules.cache_clear()
    get_amr_rules.cache_clear()
