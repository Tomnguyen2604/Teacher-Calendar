#!/bin/bash
set -e

# Update system
yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install git
yum install -y git

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
rm amazon-cloudwatch-agent.rpm

# Create app directory
mkdir -p /opt/school-calendar-exchange
cd /opt/school-calendar-exchange

# Get database credentials from Secrets Manager
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id ${db_secret_arn} --region ${aws_region} --query SecretString --output text)
JWT_SECRET=$(aws secretsmanager get-secret-value --secret-id ${jwt_secret_arn} --region ${aws_region} --query SecretString --output text)

# Extract values from secrets
DB_HOST=$(echo $DB_SECRET | jq -r '.host')
DB_PORT=$(echo $DB_SECRET | jq -r '.port')
DB_NAME=$(echo $DB_SECRET | jq -r '.dbname')
DB_USER=$(echo $DB_SECRET | jq -r '.username')
DB_PASS=$(echo $DB_SECRET | jq -r '.password')

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME
JWT_SECRET=$JWT_SECRET
AWS_REGION=${aws_region}
S3_BUCKET=${s3_bucket}
EOF

# Clone or download application code
# In production, you would pull from a git repository or S3
# For now, we'll create a placeholder
echo "Application deployment would happen here"

# Install dependencies
# npm install --production

# Create systemd service
cat > /etc/systemd/system/school-calendar.service << 'EOF'
[Unit]
Description=School Calendar Exchange API
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/school-calendar-exchange
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=school-calendar

[Install]
WantedBy=multi-user.target
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/school-calendar/*.log",
            "log_group_name": "/aws/ec2/${var.app_name}",
            "log_stream_name": "{instance_id}/application"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "SchoolCalendar",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Enable and start the service
# systemctl enable school-calendar
# systemctl start school-calendar

echo "User data script completed successfully"
