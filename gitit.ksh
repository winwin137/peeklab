VERSION=v5.1.6
WHATEVS="before sidbar menu"
echo $VERSION
echo $WHATEVS
#exit 
# 1. Make your changes to the files (edit, add, delete, etc.)
#    (After making your changes...)

# 2. Stage your changes
git add .

# 3. Commit with a descriptive message
git commit -m "PROD $WHATEVS" 

# 4. Create a new annotated tag (recommended for versions)
git tag -a $VERSION -m "PROD: $WHATEVS" 

# 5. Push both the commit and the new tag to remote
git push origin main  # Push the commit
git push origin $VERSION  # Push the tag

# Optional: Verify your new tag
git tag -n
git log -n


