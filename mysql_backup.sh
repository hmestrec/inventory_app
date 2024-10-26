#!/bin/bash

# Define variables
BACKUP_DIR="/mnt/c/Users/User/OneDrive - Lone Star College/School Work (By Semester)/Fall 2024/ITCS3330 Applied Database Management/FinalProject/inventory_app/backups"
DB_NAME="inventory_system"
DB_USER="newuser"
DB_PASS="StrongPassword123!"
DATE=$(date +"%Y%m%d%H%M%S")
BACKUP_FILE="$BACKUP_DIR/$DB_NAME-$DATE.sql"

# Create the backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > "$BACKUP_FILE"

# Check if the backup was created successfully
if [ -f "$BACKUP_FILE" ]; then
  # Optional: Compress the backup
  #gzip "$BACKUP_FILE"
  
  echo "Backup completed: $BACKUP_FILE"
else
  echo "Error: Backup failed!"
fi

