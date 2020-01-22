####################################################################
#########            Copyright 2016 BigSQL               ###########
####################################################################

if [[ $# -eq 0 ]] ; then
    echo 'No version number specified'
    exit 1
fi

directory_path=`dirname "$this";`
working_directory=`cd "$directory_path/.."; pwd`
version_number="$1"
bam_version_directory="bam2-$1"

cd "$working_directory/bam2-ng"
git pull
#git fetch --prune --tags
#git tag "$version_number"
#git push --tags
cd "$working_directory"
mkdir "$bam_version_directory"
cp -rf "$working_directory"/bam2-ng/* "$working_directory"/"$bam_version_directory"/
cd "$working_directory/$bam_version_directory/bam_ui"
gulp dist-build
cd "$working_directory"
grep -rl "bam_version_number" "$working_directory/$bam_version_directory" | xargs sed -i "s/bam_version_number/$version_number/g"
grep -rl "bam_ui" "$working_directory/$bam_version_directory/bin" | xargs sed -i "s/bam_ui/web/g"
rm -rf "$working_directory/$bam_version_directory/bam_ui"
tar cvjf "$bam_version_directory".tar.bz2 "$bam_version_directory"

