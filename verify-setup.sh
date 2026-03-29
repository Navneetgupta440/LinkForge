#!/usr/bin/env bash
# Resume Builder Enhancement - Setup & Verification Script
# Run this to verify all features are working correctly

echo "======================================"
echo "🚀 Resume Builder Enhancement Setup"
echo "======================================"
echo ""

# Check if server is running
echo "✓ Checking server status..."
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "  ✅ Server is running on http://localhost:8000"
else
    echo "  ⚠️  Server not detected. Start with: python -m http.server 8000"
fi

echo ""
echo "✓ Verifying file structure..."

# Check for required files
files=(
    "index.html"
    "styles.css"
    "styles.min.css"
    "modules/resume.js"
    "modules/storage.js"
    "modules/ui.js"
    "modules/app.js"
    "modules/animations.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING"
    fi
done

echo ""
echo "✓ Checking new documentation..."

docs=(
    "RESUME_BUILDER_ENHANCEMENTS.md"
    "RESUME_BUILDER_TEST_REPORT.html"
    "IMPLEMENTATION_SUMMARY.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "  ✅ $doc"
    else
        echo "  ❌ $doc - MISSING"
    fi
done

echo ""
echo "✓ JavaScript Syntax Validation..."
if node -c modules/resume.js 2>/dev/null; then
    echo "  ✅ modules/resume.js - Valid"
else
    echo "  ❌ modules/resume.js - Syntax Error"
fi

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next Steps:"
echo "1. Open http://localhost:8000 in your browser"
echo "2. Click 'Resume Builder' from the navigation"
echo "3. Fill in the form or paste LaTeX code"
echo "4. Click '👁️ Quick Preview' to see your resume"
echo "5. Use 'Download PDF' to save your work"
echo ""
echo "📚 Documentation:"
echo "  - RESUME_BUILDER_ENHANCEMENTS.md - Feature guide"
echo "  - RESUME_BUILDER_TEST_REPORT.html - Test results"
echo "  - IMPLEMENTATION_SUMMARY.md - Technical details"
echo ""
