#!/bin/bash

# Script de conversion du guide utilisateur en PDF
# Nécessite pandoc et wkhtmltopdf

echo "🔄 Conversion du guide utilisateur en PDF..."

# Vérifier si pandoc est installé
if ! command -v pandoc &> /dev/null; then
    echo "❌ Pandoc n'est pas installé. Installation..."
    apt-get update && apt-get install -y pandoc
fi

# Vérifier si wkhtmltopdf est installé
if ! command -v wkhtmltopdf &> /dev/null; then
    echo "❌ wkhtmltopdf n'est pas installé. Installation..."
    apt-get update && apt-get install -y wkhtmltopdf
fi

# Conversion
echo "📄 Conversion en cours..."
pandoc /app/GUIDE_UTILISATEUR_COMPLET.md \
    -o /app/GUIDE_UTILISATEUR_COMPLET.pdf \
    --pdf-engine=wkhtmltopdf \
    --toc \
    --toc-depth=3 \
    -V geometry:margin=1in \
    -V linkcolor:blue \
    --metadata title="Guide Utilisateur - My Events Church" \
    --metadata author="Impact Centre Chrétien BFC" \
    --metadata date="Novembre 2025"

if [ $? -eq 0 ]; then
    echo "✅ PDF créé avec succès : /app/GUIDE_UTILISATEUR_COMPLET.pdf"
    echo "📊 Taille du fichier : $(du -h /app/GUIDE_UTILISATEUR_COMPLET.pdf | cut -f1)"
else
    echo "❌ Erreur lors de la conversion"
    exit 1
fi
