#!/bin/bash
# install-deps.sh
# Installs the three sub-skills required by threejs-perf-doctor
#
# Sub-Skill 1: CloudAI-X/threejs-skills (10 Three.js Claude Code skills)
# Sub-Skill 2: mrdoob/three.js (official repo -- sparse checkout of docs/manual only)
# Sub-Skill 3: dgreenheck/webgpu-claude-skill (WebGPU + TSL deep reference)

set -e

SKILLS_DIR="${HOME}/.claude/skills"
PERF_DOCTOR_DIR="${SKILLS_DIR}/threejs-perf-doctor"
REFS_DIR="${PERF_DOCTOR_DIR}/references"

echo "=== Three.js Performance Doctor: Installing Dependencies ==="
echo ""

# -------------------------------------------------------
# Sub-Skill 1: threejs-skills (API & Pattern Knowledge)
# -------------------------------------------------------
THREEJS_SKILLS_MARKER="${SKILLS_DIR}/threejs-fundamentals/SKILL.md"

if [ -f "$THREEJS_SKILLS_MARKER" ]; then
  echo "[OK] Sub-Skill 1 (threejs-skills) already installed."
else
  echo "[INSTALL] Sub-Skill 1: Cloning CloudAI-X/threejs-skills..."
  TEMP_DIR=$(mktemp -d)
  git clone --depth 1 https://github.com/CloudAI-X/threejs-skills.git "$TEMP_DIR"
  
  # Copy each skill into the skills directory
  for skill_dir in "$TEMP_DIR"/skills/*/; do
    skill_name=$(basename "$skill_dir")
    target="${SKILLS_DIR}/${skill_name}"
    if [ -d "$target" ]; then
      echo "  [SKIP] ${skill_name} already exists"
    else
      cp -r "$skill_dir" "$target"
      echo "  [OK] Installed ${skill_name}"
    fi
  done
  
  rm -rf "$TEMP_DIR"
  echo "[DONE] Sub-Skill 1 installed."
fi

echo ""

# -------------------------------------------------------
# Sub-Skill 2: three.js official repo (docs & manual only)
# -------------------------------------------------------
THREEJS_REPO_DIR="${REFS_DIR}/threejs-repo"

if [ -d "$THREEJS_REPO_DIR/manual" ] && [ -d "$THREEJS_REPO_DIR/docs" ]; then
  echo "[OK] Sub-Skill 2 (three.js docs) already installed."
else
  echo "[INSTALL] Sub-Skill 2: Sparse checkout of mrdoob/three.js (docs + manual only)..."
  
  # Ensure references directory exists
  mkdir -p "$REFS_DIR"
  
  # Remove partial installation if any
  rm -rf "$THREEJS_REPO_DIR"
  
  git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/mrdoob/three.js.git \
    "$THREEJS_REPO_DIR"
  
  cd "$THREEJS_REPO_DIR"
  git sparse-checkout set manual/en docs
  
  echo "[DONE] Sub-Skill 2 installed (docs + manual only, ~30MB)."
fi

echo ""

# -------------------------------------------------------
# Sub-Skill 3: webgpu-claude-skill (WebGPU + TSL deep reference)
# -------------------------------------------------------
WEBGPU_SKILL_DIR="${SKILLS_DIR}/webgpu-threejs-tsl"
WEBGPU_SKILL_MARKER="${WEBGPU_SKILL_DIR}/SKILL.md"

if [ -f "$WEBGPU_SKILL_MARKER" ]; then
  echo "[OK] Sub-Skill 3 (webgpu-threejs-tsl) already installed."
else
  echo "[INSTALL] Sub-Skill 3: Cloning dgreenheck/webgpu-claude-skill..."
  TEMP_DIR=$(mktemp -d)
  git clone --depth 1 https://github.com/dgreenheck/webgpu-claude-skill.git "$TEMP_DIR"

  # Copy the skill directory
  if [ -d "$TEMP_DIR/skills/webgpu-threejs-tsl" ]; then
    cp -r "$TEMP_DIR/skills/webgpu-threejs-tsl" "$WEBGPU_SKILL_DIR"
    echo "  [OK] Installed webgpu-threejs-tsl"
  else
    echo "  [WARN] Expected path skills/webgpu-threejs-tsl not found in repo"
    echo "  [WARN] Attempting to find SKILL.md..."
    FOUND_SKILL=$(find "$TEMP_DIR" -name "SKILL.md" -path "*/webgpu*" | head -1)
    if [ -n "$FOUND_SKILL" ]; then
      FOUND_DIR=$(dirname "$FOUND_SKILL")
      cp -r "$FOUND_DIR" "$WEBGPU_SKILL_DIR"
      echo "  [OK] Installed webgpu-threejs-tsl from ${FOUND_DIR}"
    else
      echo "  [ERROR] Could not find webgpu-threejs-tsl skill in repository"
    fi
  fi

  rm -rf "$TEMP_DIR"
  echo "[DONE] Sub-Skill 3 installed."
fi

echo ""
echo "=== All dependencies installed successfully ==="
echo ""
echo "Installed skills (Sub-Skill 1 -- Three.js domain knowledge):"
echo "  - threejs-fundamentals"
echo "  - threejs-geometry"
echo "  - threejs-materials"
echo "  - threejs-lighting"
echo "  - threejs-textures"
echo "  - threejs-animation"
echo "  - threejs-loaders"
echo "  - threejs-shaders"
echo "  - threejs-postprocessing"
echo "  - threejs-interaction"
echo ""
echo "Installed skills (Sub-Skill 3 -- WebGPU + TSL deep reference):"
echo "  - webgpu-threejs-tsl (TSL syntax, compute shaders, device loss, post-processing)"
echo ""
echo "Reference docs (Sub-Skill 2 -- Official Three.js):"
echo "  - ${THREEJS_REPO_DIR}/manual/en/  (optimization guides)"
echo "  - ${THREEJS_REPO_DIR}/docs/       (API reference)"
echo ""
echo "You can now use the threejs-perf-doctor skill to diagnose"
echo "and fix Three.js performance issues."
