#!/bin/bash
set -e

echo "🚀 Starting deployment to AWS..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install it first."
    exit 1
fi

# Navigate to terraform directory
cd "$(dirname "$0")/../terraform"

# Initialize Terraform
echo "📦 Initializing Terraform..."
terraform init

# Validate Terraform configuration
echo "✅ Validating Terraform configuration..."
terraform validate

# Plan the deployment
echo "📋 Planning infrastructure changes..."
terraform plan -out=tfplan

# Ask for confirmation
read -p "Do you want to apply these changes? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

# Apply the changes
echo "🔨 Applying infrastructure changes..."
terraform apply tfplan

# Get outputs
echo "📊 Deployment complete! Here are your resources:"
terraform output

# Build and deploy frontend
echo "🎨 Building frontend..."
cd ../client
npm run build

# Get S3 bucket name from Terraform output
S3_BUCKET=$(cd ../terraform && terraform output -raw s3_frontend_bucket)
CLOUDFRONT_ID=$(cd ../terraform && terraform output -raw cloudfront_distribution_id)

echo "📤 Uploading frontend to S3..."
aws s3 sync dist/ s3://$S3_BUCKET/ --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Your application is available at:"
cd ../terraform
terraform output cloudfront_domain_name
