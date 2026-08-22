"""
Enterprise Context Brain (ECB) v2.2 - Skill Loader Engine
Dynamically discovers and loads modular SKILL.md files from backend/skills/,
parsing YAML frontmatter metadata and markdown playbooks.
"""

import os
from typing import List, Dict, Any, Optional
import re
from pydantic import BaseModel


class SkillMetadata(BaseModel):
    name: str
    description: str
    version: str = "1.0.0"
    author: str = "ECB Engineering"
    file_path: str
    instructions: str


class SkillLoader:
    def __init__(self, skills_dir: Optional[str] = None):
        if skills_dir:
            self.skills_dir = skills_dir
        else:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            self.skills_dir = os.path.join(base_dir, "skills")
        self.skills: Dict[str, SkillMetadata] = {}
        self.load_skills()

    def load_skills(self) -> Dict[str, SkillMetadata]:
        self.skills = {}
        if not os.path.exists(self.skills_dir):
            return self.skills

        for entry in os.listdir(self.skills_dir):
            skill_folder = os.path.join(self.skills_dir, entry)
            if os.path.isdir(skill_folder):
                skill_file = os.path.join(skill_folder, "SKILL.md")
                if os.path.exists(skill_file):
                    skill_meta = self._parse_skill_file(skill_file)
                    if skill_meta:
                        self.skills[skill_meta.name] = skill_meta

        return self.skills

    def _parse_skill_file(self, file_path: str) -> Optional[SkillMetadata]:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            frontmatter_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
            if not frontmatter_match:
                return None

            raw_yaml = frontmatter_match.group(1)
            instructions = frontmatter_match.group(2).strip()

            meta_dict = {}
            for line in raw_yaml.split("\n"):
                if ":" in line:
                    k, v = line.split(":", 1)
                    meta_dict[k.strip()] = v.strip()

            return SkillMetadata(
                name=meta_dict.get("name", os.path.basename(os.path.dirname(file_path))),
                description=meta_dict.get("description", "ECB Specialized Skill"),
                version=meta_dict.get("version", "1.0.0"),
                author=meta_dict.get("author", "ECB Intelligence"),
                file_path=file_path,
                instructions=instructions,
            )
        except Exception as e:
            print(f"Error parsing skill at {file_path}: {e}")
            return None

    def get_skill(self, name: str) -> Optional[SkillMetadata]:
        return self.skills.get(name)

    def list_skills(self) -> List[SkillMetadata]:
        return list(self.skills.values())
