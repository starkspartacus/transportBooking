#!/bin/bash

echo "🔧 Fixing Prisma setup..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "🗄️ Pushing schema to database..."
npx prisma db push

# Verify the setup
echo "✅ Verifying Prisma setup..."
npx prisma validate

echo "🎉 Prisma setup completed!"
echo ""
echo "Next steps:"
echo "1. Restart your Next.js development server"
echo "2. Test the patron dashboard"
echo "3. Check that all API routes are working"
